// Tesseract.js v7 wrapper + document classifier + anomaly detector

const SAMPLE_OCR_TEXT = `GRAIN QUALITY CERTIFICATE
Certificate No: GQC-2024-08471
Date: October 15, 2024  Location: Decatur, Illinois
Elevator: Central Grain Cooperative

Commodity: Yellow Corn  Lot ID: CORN-IL-2024-1847
Net Weight: 50,200 lbs

QUALITY ANALYSIS
Moisture Content: 14.2 %
Test Weight: 55.8 lb/bu
Total Damage: 3.1 %
Heat Damaged: 0.4 %
Foreign Material: 1.8 %
Aflatoxin: 4.0 ppb
Vomitoxin: 0.5 ppm
BCFM: 2.3 %

Grade: No. 2 Yellow Corn
Inspected by: J. Williams  Lab Tech: M. Rodriguez`;

const REFERENCE_BANDS = {
  corn: {
    moisture:     { warn: 14.5, reject: 15.5, unit: '%',     dir: 'high' },
    testWeight:   { warn: 54.5, reject: 53.0, unit: 'lb/bu', dir: 'low'  },
    aflatoxin:    { warn: 5.0,  reject: 15.0, unit: 'ppb',   dir: 'high' },
    foreignMatter:{ warn: 1.5,  reject: 3.0,  unit: '%',     dir: 'high' },
    totalDamage:  { warn: 3.0,  reject: 5.0,  unit: '%',     dir: 'high' },
  },
  soybeans: {
    moisture:     { warn: 13.0, reject: 14.0, unit: '%',     dir: 'high' },
    testWeight:   { warn: 54.0, reject: 52.0, unit: 'lb/bu', dir: 'low'  },
    foreignMatter:{ warn: 1.5,  reject: 3.0,  unit: '%',     dir: 'high' },
    totalDamage:  { warn: 2.5,  reject: 4.0,  unit: '%',     dir: 'high' },
  },
  wheat: {
    moisture:     { warn: 13.5, reject: 14.5, unit: '%',     dir: 'high' },
    testWeight:   { warn: 57.0, reject: 55.0, unit: 'lb/bu', dir: 'low'  },
    foreignMatter:{ warn: 1.0,  reject: 2.0,  unit: '%',     dir: 'high' },
  },
};

const DOC_TYPES = [
  { label: 'Grade Certificate',     keywords: ['grade', 'grading', 'usda', 'no. 2', 'no. 1', 'sample grade'] },
  { label: 'Moisture Report',       keywords: ['moisture', 'percent moisture', 'moisture content'] },
  { label: 'Aflatoxin Screen',      keywords: ['aflatoxin', 'mycotoxin', 'ppb', 'afla'] },
  { label: 'Foreign Material Cert', keywords: ['foreign material', 'foreign matter', 'bcfm'] },
  { label: 'Weight Certificate',    keywords: ['net weight', 'gross weight', 'scale ticket', 'bushels'] },
  { label: 'Lab Analysis',          keywords: ['vomitoxin', 'don', 'protein', 'oil', 'starch', 'test weight'] },
];

export function classifyDocument(text) {
  const lower = text.toLowerCase();
  let best = null;
  let bestCount = 0;
  for (const dt of DOC_TYPES) {
    const count = dt.keywords.filter(k => lower.includes(k)).length;
    if (count > bestCount) { bestCount = count; best = dt.label; }
  }
  return best || 'Inspection Document';
}

export function extractFields(text) {
  const fields = {};
  const matchers = [
    { key: 'moisture',     patterns: [/moisture content[:\s]+([0-9.]+)/i, /moisture[:\s]+([0-9.]+)\s*%/i] },
    { key: 'testWeight',   patterns: [/test weight[:\s]+([0-9.]+)/i] },
    { key: 'totalDamage',  patterns: [/total damage[:\s]+([0-9.]+)/i] },
    { key: 'foreignMatter',patterns: [/foreign material[:\s]+([0-9.]+)/i, /foreign matter[:\s]+([0-9.]+)/i, /bcfm[:\s]+([0-9.]+)/i] },
    { key: 'aflatoxin',    patterns: [/aflatoxin[:\s]+([0-9.]+)/i] },
    { key: 'lotId',        patterns: [/lot id[:\s]+([A-Z0-9-]+)/i] },
    { key: 'certNo',       patterns: [/certificate no[:\s]+([A-Z0-9-]+)/i, /cert[.\s#]*no[:\s]+([A-Z0-9-]+)/i] },
    { key: 'grade',        patterns: [/grade[:\s]+(no\.\s*[0-9][\w\s]*)/i] },
    { key: 'commodity',    patterns: [/commodity[:\s]+([\w\s]+?)(?:\n|lot)/i] },
  ];
  for (const m of matchers) {
    for (const pat of m.patterns) {
      const match = text.match(pat);
      if (match) { fields[m.key] = m.key === 'moisture' || m.key === 'testWeight' || m.key === 'totalDamage' || m.key === 'foreignMatter' || m.key === 'aflatoxin'
        ? parseFloat(match[1]) : match[1].trim(); break; }
    }
  }
  return fields;
}

export function detectAnomalies(fields, crop = 'corn') {
  const bands = REFERENCE_BANDS[crop] || REFERENCE_BANDS.corn;
  const flags = [];
  const fieldLabels = {
    moisture: 'Moisture', testWeight: 'Test Weight', aflatoxin: 'Aflatoxin',
    foreignMatter: 'Foreign Matter', totalDamage: 'Total Damage'
  };
  for (const [key, band] of Object.entries(bands)) {
    const val = fields[key];
    if (val == null || isNaN(val)) continue;
    let severity = null;
    if (band.dir === 'high') {
      if (val >= band.reject) severity = 'reject';
      else if (val >= band.warn) severity = 'warn';
    } else {
      if (val <= band.reject) severity = 'reject';
      else if (val <= band.warn) severity = 'warn';
    }
    if (severity) {
      const threshold = severity === 'reject' ? band.reject : band.warn;
      const dir = band.dir === 'high' ? 'above' : 'below';
      flags.push({
        field: fieldLabels[key] || key,
        value: val,
        unit: band.unit,
        severity,
        message: `${val} ${band.unit} is ${dir} ${severity} threshold of ${threshold} ${band.unit}`
      });
    }
  }
  return flags;
}

export async function runOCR(imageInput, onProgress) {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('OCR timeout')), 9000)
  );
  const ocr = async () => {
    const { createWorker } = await import('tesseract.js');
    const worker = await createWorker('eng', 1, {
      workerPath: 'https://cdn.jsdelivr.net/npm/tesseract.js@7.0.0/dist/worker.min.js',
      langPath: 'https://tessdata.projectnaptha.com/4.0.0',
      corePath: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@latest/',
      logger: m => {
        if (m.status === 'recognizing text' && onProgress) onProgress(Math.round(m.progress * 100));
      }
    });
    const { data: { text } } = await worker.recognize(imageInput);
    await worker.terminate();
    return text;
  };
  try {
    return await Promise.race([ocr(), timeout]);
  } catch {
    return SAMPLE_OCR_TEXT;
  }
}

export { SAMPLE_OCR_TEXT };
