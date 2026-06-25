/**
 * NAUXIMAR Module 2 — Form Processor
 * Runs entirely in the browser. No backend. No extra cost.
 *
 * Flow:
 *   PDF file → base64 → Claude API → filled field values → pdf-lib → filled PDF download
 */

import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const CLAUDE_API_KEY = import.meta.env.VITE_CLAUDE_API_KEY || '';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface VesselData {
  vessel_name:             string | null;
  imo_number:              string | null;
  call_sign:               string | null;
  flag_state:              string | null;
  port_of_registry:        string | null;
  gross_tonnage:           string | null;
  net_tonnage:             string | null;
  loa:                     string | null;
  beam:                    string | null;
  draft:                   string | null;
  built_year:              string | null;
  vessel_type:             string | null;
  classification_society:  string | null;
  p_and_i_club:            string | null;
  master_name:             string | null;
  master_nationality:      string | null;
  total_crew:              string | null;
  owner_name:              string | null;
  manager_name:            string | null;
  agent_name:              string | null;
}

export interface ProcessResult {
  success:          boolean;
  filledPdfBytes?:  Uint8Array;
  filename?:        string;
  formType?:        string;
  portName?:        string;
  fieldsFilledCount: number;
  fillMethod?:      string;
  confidence?:      string;
  error?:           string;
}

export type ProgressStep =
  | 'idle'
  | 'reading'     // Reading PDF file
  | 'parsing'     // Claude analysing form
  | 'filling'     // Claude + pdf-lib filling
  | 'saving'      // Writing final PDF
  | 'logging'     // Airtable write
  | 'done'
  | 'error';

// ─── Main export: process a form ─────────────────────────────────────────────

export async function processForm(
  file:       File,
  vessel:     VesselData,
  onProgress: (step: ProgressStep, detail?: string) => void
): Promise<ProcessResult> {

  try {
    // ── 1. Read PDF as base64 ──────────────────────────────────────────────
    onProgress('reading', 'Reading PDF...');
    const pdfBase64 = await fileToBase64(file);

    // ── 2. Claude analyses the form ────────────────────────────────────────
    onProgress('parsing', 'AI reading form structure...');
    const analysis = await analyseWithClaude(pdfBase64, file.name, vessel);

    // ── 3. Fill the PDF ────────────────────────────────────────────────────
    onProgress('filling', `Filling ${analysis.fieldsToFill.length} fields...`);
    const pdfBytes = base64ToUint8Array(pdfBase64);
    const { filledBytes, count, method } = await fillPdf(pdfBytes, analysis, vessel);

    // ── 4. Done ────────────────────────────────────────────────────────────
    onProgress('saving', 'Preparing download...');
    const filledName = file.name.replace(/\.pdf$/i, '') + '_NAUXIMAR_FILLED.pdf';

    return {
      success:           true,
      filledPdfBytes:    filledBytes,
      filename:          filledName,
      formType:          analysis.formType,
      portName:          analysis.portName,
      fieldsFilledCount: count,
      fillMethod:        method,
      confidence:        analysis.confidence,
    };

  } catch (err: any) {
    onProgress('error', err.message);
    return {
      success: false,
      error: err.message,
      fieldsFilledCount: 0,
    };
  }
}

// ─── Claude: analyse form + determine fill values ─────────────────────────────

interface ClaudeAnalysis {
  formType:      string;
  portName:      string | null;
  confidence:    string;
  isFillable:    boolean;
  fieldsToFill:  FieldPlacement[];
}

interface FieldPlacement {
  text:        string;  // value to write
  x:           number;  // PDF coords (0,0 = bottom-left)
  y:           number;
  fontSize:    number;
  page:        number;
  description: string;
}

async function analyseWithClaude(
  pdfBase64: string,
  filename:  string,
  vessel:    VesselData
): Promise<ClaudeAnalysis> {

  const prompt = `You are a maritime forms specialist. Analyse this port form PDF and tell me where to place vessel data.

VESSEL DATA AVAILABLE:
${JSON.stringify(vessel, null, 2)}

INSTRUCTIONS:
1. Identify the form type (General Declaration, Crew List, Port Entry, etc.)
2. Find every blank field that has matching vessel data
3. For each field, give the EXACT PDF coordinates to place the text

PDF COORDINATE SYSTEM:
- Origin (0,0) = BOTTOM-LEFT corner of page
- Y increases UPWARD
- Standard A4 page = 595 wide × 842 tall (points)
- Standard Letter = 612 wide × 792 tall (points)
- Place text 3-5 points ABOVE any underline

Return ONLY this JSON (no markdown, no explanation):
{
  "form_type": "exact form name",
  "port_name": "destination port or null",
  "confidence": "high|medium|low",
  "page_width": 595,
  "page_height": 842,
  "fields_to_fill": [
    {
      "text": "exact value to write",
      "x": 150,
      "y": 720,
      "font_size": 9,
      "page": 1,
      "description": "Vessel Name field"
    }
  ]
}

Only include fields where you have vessel data to fill. Skip fields with no data.
Use font_size 8-10 for most fields. Never exceed the field boundary.`;

  const response = await fetch('/api/claude-proxy', {
    method: 'POST',
    headers: {
      'Content-Type':      'application/json',
      
      
      
    },
    body: JSON.stringify({
      model:      'claude-sonnet-4-6',
      max_tokens: 4000,
      messages: [{
        role: 'user',
        content: [
          {
            type:   'document',
            source: { type: 'base64', media_type: 'application/pdf', data: pdfBase64 },
          },
          { type: 'text', text: prompt },
        ],
      }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Claude API error: ${response.status} — ${err.substring(0, 200)}`);
  }

  const data   = await response.json();
  const rawText = data.content[0].text;

  try {
    const cleaned = rawText.replace(/```json\n?|\n?```/g, '').trim();
    const parsed  = JSON.parse(cleaned);
    return {
      formType:     parsed.form_type      || 'Port Form',
      portName:     parsed.port_name      || null,
      confidence:   parsed.confidence     || 'medium',
      isFillable:   false,                // determined later by pdf-lib
      fieldsToFill: (parsed.fields_to_fill || []).map((f: any) => ({
        text:        String(f.text   ?? ''),
        x:           Number(f.x      ?? 100),
        y:           Number(f.y      ?? 100),
        fontSize:    Number(f.font_size ?? 9),
        page:        Number(f.page   ?? 1),
        description: String(f.description ?? ''),
      })),
    };
  } catch {
    // Claude returned non-JSON — still try to fill native fields
    return {
      formType:     'Port Form',
      portName:     null,
      confidence:   'low',
      isFillable:   false,
      fieldsToFill: [],
    };
  }
}

// ─── PDF filler: tries native fields first, falls back to overlay ─────────────

async function fillPdf(
  pdfBytes: Uint8Array | ArrayBuffer,
  analysis: ClaudeAnalysis,
  vessel:   VesselData
): Promise<{ filledBytes: Uint8Array; count: number; method: string }> {

  const bytes  = pdfBytes instanceof Uint8Array ? pdfBytes : new Uint8Array(pdfBytes as ArrayBuffer);
  const pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const form   = pdfDoc.getForm();
  const fields = form.getFields();

  // ── PATH A: PDF has native AcroForm fields ─────────────────────────────
  if (fields.length > 0) {
    const map   = buildFieldMap(vessel);
    let   count = 0;

    for (const field of fields) {
      const name = field.getName().toLowerCase().replace(/[\s_\-().]/g, '');
      for (const [pattern, value] of Object.entries(map)) {
        if (value && name.includes(pattern)) {
          try {
            const typeName = field.constructor.name;
            if (typeName === 'PDFTextField') {
              (field as any).setText(String(value));
              count++;
            } else if (typeName === 'PDFCheckBox') {
              if (['yes','true','1','x'].includes(String(value).toLowerCase())) {
                (field as any).check();
                count++;
              }
            }
          } catch (_) { /* skip unwritable field */ }
          break;
        }
      }
    }

    // Only flatten if we filled something (keeps blank fields editable)
    if (count > 0) {
      try { form.flatten(); } catch (_) {}
    }

    return { filledBytes: await pdfDoc.save(), count, method: 'native_fields' };
  }

  // ── PATH B: Flat/scanned PDF — overlay text at Claude's coordinates ────
  if (analysis.fieldsToFill.length === 0) {
    // Claude gave us nothing useful — return unchanged PDF
    return { filledBytes: await pdfDoc.save(), count: 0, method: 'no_fields_found' };
  }

  const font  = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const pages = pdfDoc.getPages();
  let   count = 0;

  for (const placement of analysis.fieldsToFill) {
    if (!placement.text) continue;
    try {
      const pageIndex = Math.max(0, Math.min(placement.page - 1, pages.length - 1));
      const page      = pages[pageIndex];
      page.drawText(placement.text, {
        x:     placement.x,
        y:     placement.y,
        size:  Math.max(7, Math.min(14, placement.fontSize)),
        font,
        color: rgb(0, 0, 0),
      });
      count++;
    } catch (_) { /* skip bad coordinate */ }
  }

  return { filledBytes: await pdfDoc.save(), count, method: 'coordinate_overlay' };
}

// ─── Field name → vessel data map ─────────────────────────────────────────────

function buildFieldMap(v: VesselData): Record<string, string | null> {
  return {
    // Vessel name patterns
    'vessel':             v.vessel_name,
    'ship':               v.vessel_name,
    'vesselname':         v.vessel_name,
    'nameofvessel':       v.vessel_name,
    'shipname':           v.vessel_name,
    'nameofship':         v.vessel_name,
    // IMO
    'imo':                v.imo_number,
    'imonumber':          v.imo_number,
    'imonum':             v.imo_number,
    // Call sign
    'callsign':           v.call_sign,
    'radiosignal':        v.call_sign,
    'distincitve':        v.call_sign,   // common typo in port forms
    // Flag
    'flag':               v.flag_state,
    'flagstate':          v.flag_state,
    'flagofvessel':       v.flag_state,
    'nationality':        v.flag_state,
    // Tonnage
    'grosstonnage':       v.gross_tonnage,
    'grt':                v.gross_tonnage,
    'grossregistered':    v.gross_tonnage,
    'nettonnage':         v.net_tonnage,
    'nrt':                v.net_tonnage,
    // Dimensions
    'loa':                v.loa,
    'lengthoverall':      v.loa,
    'lengthofall':        v.loa,
    'beam':               v.beam,
    'breadth':            v.beam,
    'draft':              v.draft,
    'draught':            v.draft,
    // Master
    'master':             v.master_name,
    'captain':            v.master_name,
    'mastername':         v.master_name,
    'nameofmaster':       v.master_name,
    'masternationality':  v.master_nationality,
    // Crew
    'crew':               v.total_crew,
    'totalcrew':          v.total_crew,
    'numberofcrew':       v.total_crew,
    'crewnumber':         v.total_crew,
    // Port of registry
    'portofregistry':     v.port_of_registry,
    'registeredport':     v.port_of_registry,
    'registrationport':   v.port_of_registry,
    // Built
    'yearbuilt':          v.built_year,
    'built':              v.built_year,
    'yearofbuild':        v.built_year,
    // Classification
    'classification':     v.classification_society,
    'classsociety':       v.classification_society,
    'classificationsocy': v.classification_society,
    // P&I
    'pandi':              v.p_and_i_club,
    'piclub':             v.p_and_i_club,
    'pandI':              v.p_and_i_club,
    // Company
    'owner':              v.owner_name,
    'shipowner':          v.owner_name,
    'manager':            v.manager_name,
    'agent':              v.agent_name,
    'shippingagent':      v.agent_name,
    // Type
    'vesseltype':         v.vessel_type,
    'typeofship':         v.vessel_type,
    'typeofvessel':       v.vessel_type,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader   = new FileReader();
    reader.onload  = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]); // strip data:application/pdf;base64,
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes  = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function downloadPdf(bytes: Uint8Array, filename: string): void {
  const blob = new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
