import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload as UploadIcon, ArrowLeft, CheckCircle, AlertCircle, Download, Loader2 } from 'lucide-react';
import {
  createFormReceived,
  createRecord,
  fetchRecordFromAirtable,
  fetchFromAirtable,
  TABLES,
} from '../../api/airtable';
import { processForm, downloadPdf, VesselData, ProgressStep } from '../../utils/formProcessor';

interface UploadFormScreenProps {
  onBack: () => void;
  onSuccess: () => void;
}

// ── Step label map ────────────────────────────────────────────────────────────
const STEP_LABELS: Record<ProgressStep, string> = {
  idle:    '',
  reading: 'Reading PDF file...',
  parsing: 'AI analysing form structure...',
  filling: 'Auto-filling vessel data...',
  saving:  'Preparing filled PDF...',
  logging: 'Saving to database...',
  done:    'Complete!',
  error:   'Something went wrong',
};

const STEPS_ORDERED: ProgressStep[] = ['reading', 'parsing', 'filling', 'saving', 'logging'];

export default function UploadFormScreen({ onBack, onSuccess }: UploadFormScreenProps) {
  // ── Form state (same as before) ───────────────────────────────────────────
  const [vessels,         setVessels]         = useState<any[]>([]);
  const [selectedVessel,  setSelectedVessel]  = useState('');
  const [portName,        setPortName]        = useState('');
  const [country,         setCountry]         = useState('');
  const [formName,        setFormName]        = useState('');
  const [fileName,        setFileName]        = useState('');
  const [pdfFile,         setPdfFile]         = useState<File | null>(null);

  // ── Processing state ──────────────────────────────────────────────────────
  const [step,            setStep]            = useState<ProgressStep>('idle');
  const [stepDetail,      setStepDetail]      = useState('');
  const [error,           setError]           = useState('');

  // ── Result state ──────────────────────────────────────────────────────────
  const [filledBytes,     setFilledBytes]     = useState<Uint8Array | null>(null);
  const [filledFilename,  setFilledFilename]  = useState('');
  const [resultSummary,   setResultSummary]   = useState<{
    formType:     string;
    portName:     string | null;
    fieldsFilled: number;
    confidence:   string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Load vessels on mount ─────────────────────────────────────────────────
  useEffect(() => {
    fetchFromAirtable(TABLES.VESSELS)
      .then(setVessels)
      .catch(() => setError('Failed to load vessels'));
  }, []);

  // ── File handler ──────────────────────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('Please upload a PDF file only.');
      return;
    }
    setPdfFile(file);
    setFileName(file.name);
    setFormName(file.name.replace(/\.pdf$/i, ''));
    setError('');
    setFilledBytes(null);
    setResultSummary(null);
    setStep('idle');
  };

  // ── Map Airtable vessel record → VesselData ───────────────────────────────
  function mapVesselFields(record: any): VesselData {
    const f = record.fields;
    return {
      vessel_name:            f['Vessel Name']            || null,
      imo_number:             f['IMO Number']             || null,
      call_sign:              f['Call Sign']              || null,
      flag_state:             f['Flag State']             || null,
      port_of_registry:       f['Port of Registry']       || null,
      gross_tonnage:          f['Gross Tonnage']          ? String(f['Gross Tonnage']) : null,
      net_tonnage:            f['Net Tonnage']            ? String(f['Net Tonnage'])   : null,
      loa:                    f['LOA']                    ? String(f['LOA'])           : null,
      beam:                   f['Beam']                   ? String(f['Beam'])          : null,
      draft:                  f['Draft']                  ? String(f['Draft'])         : null,
      built_year:             f['Year Built']             ? String(f['Year Built'])    : null,
      vessel_type:            f['Vessel Type']            || null,
      classification_society: f['Classification Society'] || null,
      p_and_i_club:           f['P&I Club']               || null,
      master_name:            f['Master Name']            || null,
      master_nationality:     f['Master Nationality']     || null,
      total_crew:             f['Total Crew']             ? String(f['Total Crew'])    : null,
      owner_name:             f['Owner']                  || null,
      manager_name:           f['Manager']                || null,
      agent_name:             f['Agent']                  || null,
    };
  }

  // ── Main submit ───────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFilledBytes(null);
    setResultSummary(null);

    // Validate
    if (!selectedVessel) { setError('Please select a vessel.'); return; }
    if (!portName)        { setError('Please enter the port name.'); return; }
    if (!pdfFile)         { setError('Please upload a PDF form.'); return; }

    // Get full vessel record from Airtable
    setStep('reading');
    let vesselRecord: any;
    try {
      vesselRecord = await fetchRecordFromAirtable(TABLES.VESSELS, selectedVessel);
    } catch {
      setStep('error');
      setError('Could not load vessel data from database.');
      return;
    }

    const vesselData = mapVesselFields(vesselRecord);
    const vesselName = vesselData.vessel_name || 'Unknown';

    // ── Run the processor ─────────────────────────────────────────────────
    const result = await processForm(
      pdfFile,
      vesselData,
      (s: ProgressStep, detail?: string) => {
        setStep(s);
        setStepDetail(detail || '');
      }
    );

    if (!result.success) {
      setStep('error');
      setError(result.error || 'Processing failed. Please try again.');
      return;
    }

    // ── Log to Airtable ───────────────────────────────────────────────────
    setStep('logging');
    try {
      // 1. FORMS_RECEIVED (inbound record — same as before)
      await createFormReceived({
        formName:   formName || fileName,
        vesselName,
        country:    country || portName,
        agentName:  'Web Upload',
        agentEmail: 'forms@nauximar.com',
      });

      // 2. FORMS_COMPLETED (new record with fill results)
      await createRecord(TABLES.FORMS_COMPLETED, {
        'Form Name':         result.formType || formName || fileName,
        'Vessel Name':       [selectedVessel],
        'Original Filename': fileName,
        'Filled Filename':   result.filename || '',
        'Fields Filled':     result.fieldsFilledCount,
        'Fill Method':       result.fillMethod || '',
        'Port Name':         portName,
        'Country':           country,
        'AI Confidence':     result.confidence || 'medium',
        'Source':            'Web Upload',
        'Status':            'Completed',
        'Completed At':      new Date().toISOString(),
      });
    } catch (logErr) {
      // Logging failure is non-critical — don't block download
      console.warn('Airtable log failed (non-critical):', logErr);
    }

    // ── Done ──────────────────────────────────────────────────────────────
    setStep('done');
    setFilledBytes(result.filledPdfBytes!);
    setFilledFilename(result.filename!);
    setResultSummary({
      formType:     result.formType     || 'Port Form',
      portName:     result.portName     || portName,
      fieldsFilled: result.fieldsFilledCount,
      confidence:   result.confidence   || 'medium',
    });
  };

  const handleDownload = () => {
    if (filledBytes && filledFilename) {
      downloadPdf(filledBytes, filledFilename);
    }
  };

  const handleReset = () => {
    setStep('idle');
    setError('');
    setFilledBytes(null);
    setResultSummary(null);
    setPdfFile(null);
    setFileName('');
    setFormName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const isProcessing = ['reading','parsing','filling','saving','logging'].includes(step);
  const isDone       = step === 'done';
  const isError      = step === 'error';

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="pt-24 pb-12 px-4">
      <div className="max-w-4xl mx-auto">

        {/* Back button */}
        <motion.button
          whileHover={{ x: -5 }}
          onClick={onBack}
          className="flex items-center gap-2 text-gold-400 hover:text-gold-300 mb-8"
        >
          <ArrowLeft size={20} />
          Back to Port Operations
        </motion.button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="h-1 w-12 bg-gold-400 rounded-full" />
            <h1 className="text-4xl font-bold text-white">Upload Form</h1>
          </div>
          <p className="text-gray-400">
            Upload a blank port form — NAUXIMAR fills it automatically with vessel data.
          </p>
        </motion.div>

        {/* ── PROCESSING STATE ── */}
        <AnimatePresence>
          {isProcessing && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-navy-800 border border-gold-400 rounded-lg p-8 mb-6"
            >
              <p className="text-gold-400 text-xs uppercase tracking-widest mb-1 font-semibold">
                Processing
              </p>
              <p className="text-white font-bold text-lg mb-6">{fileName}</p>

              <div className="space-y-3">
                {STEPS_ORDERED.map((s, i) => {
                  const currentIdx = STEPS_ORDERED.indexOf(step as ProgressStep);
                  const thisIdx    = STEPS_ORDERED.indexOf(s);
                  const done       = thisIdx < currentIdx;
                  const active     = s === step;

                  return (
                    <div key={s} className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all
                        ${done   ? 'bg-maritime-green text-white' :
                          active ? 'bg-gold-400 text-navy-900 animate-pulse' :
                                   'bg-navy-700 text-gray-500'}`}>
                        {done ? '✓' : i + 1}
                      </div>
                      <span className={`text-sm transition-colors
                        ${active ? 'text-white font-semibold' :
                          done   ? 'text-maritime-green' :
                                   'text-gray-500'}`}>
                        {STEP_LABELS[s]}
                        {active && stepDetail && (
                          <span className="text-gold-400 ml-2 font-normal">{stepDetail}</span>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Spinner */}
              <div className="flex items-center gap-2 mt-6 text-gray-400 text-sm">
                <Loader2 size={16} className="animate-spin text-gold-400" />
                This takes 15–30 seconds depending on form complexity
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── SUCCESS STATE ── */}
        <AnimatePresence>
          {isDone && resultSummary && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-navy-800 border border-maritime-green rounded-lg overflow-hidden mb-6"
            >
              {/* Green header */}
              <div className="bg-maritime-green/20 border-b border-maritime-green px-6 py-4 flex items-center gap-3">
                <CheckCircle className="text-maritime-green flex-shrink-0" size={22} />
                <div>
                  <p className="text-maritime-green font-bold">Form filled successfully</p>
                  <p className="text-gray-400 text-sm">{filledFilename}</p>
                </div>
              </div>

              {/* Summary grid */}
              <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                  <SummaryCard label="Form Type"     value={resultSummary.formType} />
                  <SummaryCard label="Port"          value={resultSummary.portName || portName} />
                  <SummaryCard label="Fields Filled" value={String(resultSummary.fieldsFilled)} />
                  <SummaryCard
                    label="AI Confidence"
                    value={resultSummary.confidence}
                    highlight={resultSummary.confidence === 'low'}
                  />
                </div>

                {resultSummary.confidence === 'low' && (
                  <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-3 mb-4 text-yellow-300 text-sm">
                    ⚠ Low confidence — please review the filled form carefully before sending to port authorities.
                  </div>
                )}

                {/* Download button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleDownload}
                  className="w-full bg-gold-400 text-navy-900 font-bold py-4 rounded-lg hover:shadow-gold transition-all flex items-center justify-center gap-2 text-lg"
                >
                  <Download size={20} />
                  Download Filled Form
                </motion.button>

                <button
                  onClick={handleReset}
                  className="w-full mt-3 text-gray-500 hover:text-gray-300 text-sm py-2 transition-colors"
                >
                  Process another form
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── ERROR STATE ── */}
        <AnimatePresence>
          {isError && error && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-maritime-red/20 border border-maritime-red rounded-lg p-4 mb-6 flex items-start gap-3"
            >
              <AlertCircle className="text-maritime-red flex-shrink-0 mt-0.5" size={18} />
              <div>
                <p className="text-maritime-red font-semibold">Processing failed</p>
                <p className="text-gray-300 text-sm mt-1">{error}</p>
                <button
                  onClick={handleReset}
                  className="text-gold-400 text-sm mt-2 hover:text-gold-300"
                >
                  Try again →
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── MAIN FORM (hidden during processing/done) ── */}
        <AnimatePresence>
          {!isProcessing && !isDone && (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-navy-800 border border-gold-400 rounded-lg p-8 shadow-card"
            >
              <form onSubmit={handleSubmit} className="space-y-6">

                {/* Vessel Selection */}
                <div>
                  <label className="block text-white font-semibold mb-3">
                    Select Vessel <span className="text-maritime-red">*</span>
                  </label>
                  <select
                    value={selectedVessel}
                    onChange={(e) => setSelectedVessel(e.target.value)}
                    className="w-full bg-navy-700 border border-navy-600 rounded-lg px-4 py-3 text-white focus:border-gold-400 focus:outline-none transition-colors"
                  >
                    <option value="">Choose a vessel...</option>
                    {vessels.map((vessel) => (
                      <option key={vessel.id} value={vessel.id}>
                        {vessel.fields['Vessel Name']} — IMO: {vessel.fields['IMO Number']}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Port Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-white font-semibold mb-3">
                      Port Name <span className="text-maritime-red">*</span>
                    </label>
                    <input
                      type="text"
                      value={portName}
                      onChange={(e) => setPortName(e.target.value)}
                      placeholder="e.g., Singapore"
                      className="w-full bg-navy-700 border border-navy-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-gold-400 focus:outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-white font-semibold mb-3">Country</label>
                    <input
                      type="text"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="e.g., Singapore"
                      className="w-full bg-navy-700 border border-navy-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-gold-400 focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* File Upload */}
                <div>
                  <label className="block text-white font-semibold mb-3">
                    Upload Blank Form (PDF) <span className="text-maritime-red">*</span>
                  </label>
                  <motion.div
                    whileHover={{ borderColor: '#FFD700' }}
                    className="border-2 border-dashed border-gold-400 rounded-lg p-8 text-center hover:bg-navy-700/50 transition-colors cursor-pointer"
                    
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <UploadIcon className="mx-auto mb-4 text-gold-400" size={32} />
                    <p className="text-white font-semibold mb-2">Click to upload or drag and drop</p>
                    <p className="text-gray-400 text-sm">PDF only — General Declaration, Crew List, Port Entry, etc.</p>
                    {fileName && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-gold-400 text-sm mt-4 font-medium"
                      >
                        ✓ {fileName}
                      </motion.p>
                    )}
                  </motion.div>
                </div>

                {/* Form Description */}
                <div>
                  <label className="block text-white font-semibold mb-3">
                    Form Description
                    <span className="text-gray-400 font-normal text-sm ml-2">(auto-detected, editable)</span>
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g., Pre-arrival health declaration"
                    className="w-full bg-navy-700 border border-navy-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-gold-400 focus:outline-none transition-colors"
                  />
                </div>

                {/* Inline error */}
                {error && !isError && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-maritime-red/20 border border-maritime-red rounded-lg p-4 text-maritime-red text-sm"
                  >
                    {error}
                  </motion.div>
                )}

                {/* Buttons */}
                <div className="flex gap-4 pt-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isProcessing}
                    className="flex-1 bg-gold-400 text-navy-900 font-bold py-3 rounded-lg hover:shadow-gold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isProcessing
                      ? <><Loader2 size={18} className="animate-spin" /> Processing...</>
                      : '⚡ Auto-Fill with AI'
                    }
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={onBack}
                    className="flex-1 border-2 border-gold-400 text-gold-400 font-bold py-3 rounded-lg hover:bg-navy-700 transition-all"
                  >
                    Cancel
                  </motion.button>
                </div>

              </form>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}

// ── Small summary card component ──────────────────────────────────────────────
function SummaryCard({
  label, value, highlight = false
}: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="bg-navy-700 rounded-lg p-3">
      <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-sm font-semibold ${highlight ? 'text-yellow-400' : 'text-white'}`}>
        {value || '—'}
      </p>
    </div>
  );
}
