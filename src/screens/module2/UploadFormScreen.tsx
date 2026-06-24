import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Upload as UploadIcon, ArrowLeft } from 'lucide-react';
import { createFormReceived, fetchFromAirtable, TABLES } from '../../api/airtable';

interface UploadFormScreenProps {
  onBack: () => void;
  onSuccess: () => void;
}

export default function UploadFormScreen({ onBack, onSuccess }: UploadFormScreenProps) {
  const [vessels, setVessels] = useState<any[]>([]);
  const [selectedVessel, setSelectedVessel] = useState('');
  const [portName, setPortName] = useState('');
  const [country, setCountry] = useState('');
  const [formName, setFormName] = useState('');
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const loadVessels = async () => {
      try {
        const data = await fetchFromAirtable(TABLES.VESSELS);
        setVessels(data);
      } catch (err) {
        setError('Failed to load vessels');
      }
    };
    loadVessels();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      setFormName(file.name.replace('.pdf', ''));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!selectedVessel || !portName || !fileName) {
        setError('Please fill all required fields');
        return;
      }

      const vessel = vessels.find(v => v.id === selectedVessel);
      
      await createFormReceived({
        formName: formName || fileName,
        vesselName: vessel.fields['Vessel Name'],
        country: country || portName,
        agentName: 'Agent Name',
        agentEmail: 'agent@email.com',
      });

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err) {
      setError('Failed to upload form. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-24 pb-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.button
          whileHover={{ x: -5 }}
          onClick={onBack}
          className="flex items-center gap-2 text-gold-400 hover:text-gold-300 mb-8"
        >
          <ArrowLeft size={20} />
          Back to Port Operations
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="h-1 w-12 bg-gold-400 rounded-full" />
            <h1 className="text-4xl font-bold text-white">Upload Form</h1>
          </div>
          <p className="text-gray-400">Submit a blank port form for processing</p>
        </motion.div>

        {/* Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
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
                    {vessel.fields['Vessel Name']} (IMO: {vessel.fields['IMO Number']})
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
                <label className="block text-white font-semibold mb-3">
                  Country <span className="text-maritime-red">*</span>
                </label>
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
                Upload Blank Form <span className="text-maritime-red">*</span>
              </label>
              <motion.div
                whileHover={{ borderColor: '#FFD700' }}
                className="border-2 border-dashed border-gold-400 rounded-lg p-8 text-center hover:bg-navy-700/50 transition-colors"
              >
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  id="form-upload"
                />
                <label htmlFor="form-upload" className="cursor-pointer">
                  <UploadIcon className="mx-auto mb-4 text-gold-400" size={32} />
                  <p className="text-white font-semibold mb-2">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-gray-400 text-sm">PDF files only</p>
                  {fileName && (
                    <p className="text-gold-400 text-sm mt-4">Selected: {fileName}</p>
                  )}
                </label>
              </motion.div>
            </div>

            {/* Form Description */}
            <div>
              <label className="block text-white font-semibold mb-3">
                Form Description (Optional)
              </label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g., Pre-arrival health declaration"
                className="w-full bg-navy-700 border border-navy-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-gold-400 focus:outline-none transition-colors"
              />
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-maritime-red/20 border border-maritime-red rounded-lg p-4 text-maritime-red"
              >
                {error}
              </motion.div>
            )}

            {/* Success Message */}
            {success && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-maritime-green/20 border border-maritime-green rounded-lg p-4 text-maritime-green"
              >
                ✓ Form uploaded successfully! Processing...
              </motion.div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                disabled={loading}
                className="flex-1 bg-gold-400 text-navy-900 font-bold py-3 rounded-lg hover:shadow-gold transition-all disabled:opacity-50"
              >
                {loading ? 'Uploading...' : 'Upload Form'}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={onBack}
                className="flex-1 border-2 border-gold-400 text-gold-400 font-bold py-3 rounded-lg hover:bg-navy-700 transition-all"
              >
                Cancel
              </motion.button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
