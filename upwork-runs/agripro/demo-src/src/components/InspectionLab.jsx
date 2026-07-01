import React, { useState, useRef } from 'react';
import { runOCR, classifyDocument, extractFields, detectAnomalies, SAMPLE_OCR_TEXT } from '../services/inspection.js';
import { StatusChip, PipelineBar, ProgressBar, InspectionStatus, EmptyState } from './Shared.jsx';
import { STAGES, STAGE_LABELS } from '../data/mockData.js';

const CROPS = ['corn', 'soybeans', 'wheat'];

// Demo sample cert description (no image file needed; we use SAMPLE_OCR_TEXT)
const DEMO_SAMPLES = [
  { name: 'GQC-2024-08471.jpg', label: 'Normal Corn Certificate', crop: 'corn', useAnomaly: false },
  { name: 'AFS-2024-00342.jpg', label: 'Flagged Corn (High Aflatoxin)', crop: 'corn', useAnomaly: true },
];

const ANOMALOUS_TEXT = `GRAIN QUALITY CERTIFICATE
Certificate No: AFS-2024-00342
Date: October 14, 2024  Location: Boone, Iowa
Elevator: Midwest Grain Terminal

Commodity: Yellow Corn  Lot ID: CORN-IA-0991
Net Weight: 49,000 lbs

QUALITY ANALYSIS
Moisture Content: 16.8 %
Test Weight: 52.1 lb/bu
Total Damage: 4.2 %
Heat Damaged: 0.9 %
Foreign Material: 3.6 %
Aflatoxin: 22.0 ppb
Vomitoxin: 1.2 ppm
BCFM: 4.1 %

Grade: Sample Grade
Inspected by: R. Thompson  Lab Tech: K. Patel`;

export default function InspectionLab({ inspections, onStageChange, onAddInspection, appendAudit, role }) {
  const [selectedId, setSelectedId] = useState(null);
  const [ocrState, setOcrState] = useState({ status: 'idle', progress: 0, text: '', fields: {}, docType: '', flags: [] });
  const [filterStage, setFilterStage] = useState('');
  const [filterCrop, setFilterCrop] = useState('');
  const [filterSearch, setFilterSearch] = useState('');
  const [filterAnomaly, setFilterAnomaly] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [activeCrop, setActiveCrop] = useState('corn');
  const fileInputRef = useRef();

  const canApprove = role === 'procurement' || role === 'management';
  const canLabReview = role === 'quality' || role === 'management';

  const filtered = inspections.filter(ins => {
    if (filterStage && ins.stage !== filterStage) return false;
    if (filterCrop && ins.crop !== filterCrop) return false;
    if (filterAnomaly && (!ins.anomalyFlags || ins.anomalyFlags.length === 0)) return false;
    if (filterSearch) {
      const q = filterSearch.toLowerCase();
      if (!ins.id.toLowerCase().includes(q) && !ins.lotId.toLowerCase().includes(q) && !(ins.location||'').toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const selected = inspections.find(i => i.id === selectedId);

  async function handleFileUpload(file) {
    if (!file) return;
    setOcrState({ status: 'loading', progress: 5, text: '', fields: {}, docType: '', flags: [] });
    const text = await runOCR(file, pct => setOcrState(s => ({ ...s, progress: pct })));
    const docType = classifyDocument(text);
    const fields = extractFields(text);
    const flags = detectAnomalies(fields, activeCrop);
    setOcrState({ status: 'done', progress: 100, text, fields, docType, flags });
    appendAudit({ action: 'Certificate Uploaded', record: fields.certNo || 'new', detail: `OCR processed. Doc type: ${docType}. Anomaly flags: ${flags.length}` });
  }

  async function handleSampleLoad(sample) {
    const text = sample.useAnomaly ? ANOMALOUS_TEXT : SAMPLE_OCR_TEXT;
    setOcrState({ status: 'loading', progress: 5, text: '', fields: {}, docType: '', flags: [] });
    // Simulate progress
    await new Promise(r => setTimeout(r, 300));
    setOcrState(s => ({ ...s, progress: 40 }));
    await new Promise(r => setTimeout(r, 300));
    setOcrState(s => ({ ...s, progress: 80 }));
    await new Promise(r => setTimeout(r, 200));
    const docType = classifyDocument(text);
    const fields = extractFields(text);
    const flags = detectAnomalies(fields, sample.crop);
    setOcrState({ status: 'done', progress: 100, text, fields, docType, flags });
    setActiveCrop(sample.crop);
    appendAudit({ action: 'Certificate Uploaded', record: fields.certNo || sample.name, detail: `OCR processed. Doc type: ${docType}. Anomaly flags: ${flags.length}` });
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) handleFileUpload(file);
  }

  function advanceStage(insId) {
    const ins = inspections.find(i => i.id === insId);
    if (!ins) return;
    const idx = STAGES.indexOf(ins.stage);
    if (idx < STAGES.length - 1) {
      const next = STAGES[idx + 1];
      onStageChange(insId, next);
      appendAudit({ action: 'Stage Advanced', record: insId, detail: `${STAGE_LABELS[ins.stage]} -> ${STAGE_LABELS[next]}` });
    }
  }

  function flagInspection(insId) {
    appendAudit({ action: 'Flagged for Review', record: insId, detail: 'Manual flag raised by reviewer' });
    alert('Inspection flagged for review. QA team notified.');
  }

  const FIELD_DISPLAY = [
    { key: 'moisture',     label: 'Moisture', unit: '%' },
    { key: 'testWeight',   label: 'Test Weight', unit: 'lb/bu' },
    { key: 'aflatoxin',    label: 'Aflatoxin', unit: 'ppb' },
    { key: 'foreignMatter',label: 'Foreign Matter', unit: '%' },
    { key: 'totalDamage',  label: 'Total Damage', unit: '%' },
  ];

  return (
    <div style={{ display: 'flex', gap: 24, height: '100%', position: 'relative' }}>
      {/* Left panel */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* OCR Hero */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <div className="section-title">AI Inspection Lab</div>
              <div className="section-sub">Drop a lab certificate to extract, classify, and anomaly-check values</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <select className="form-input" value={activeCrop} onChange={e => setActiveCrop(e.target.value)} style={{ width: 130 }}>
                {CROPS.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
              </select>
            </div>
          </div>

          {/* Sample loaders */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: 'var(--clr-text-muted)', alignSelf: 'center' }}>Load demo cert:</span>
            {DEMO_SAMPLES.map(s => (
              <button key={s.name} className="btn btn-secondary btn-sm" onClick={() => handleSampleLoad(s)}>
                {s.useAnomaly ? '🚨' : '✅'} {s.label}
              </button>
            ))}
          </div>

          {/* Upload zone */}
          <div
            className={`upload-zone${dragging ? ' dragging' : ''}`}
            onClick={() => fileInputRef.current.click()}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
          >
            <div className="upload-zone-icon">📄</div>
            <div className="upload-zone-title">Drop lab certificate image here</div>
            <div className="upload-zone-sub">JPEG, PNG, TIFF, or use a demo cert above</div>
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }}
              onChange={e => handleFileUpload(e.target.files[0])} />
          </div>

          {/* OCR progress */}
          {ocrState.status === 'loading' && (
            <div className="ocr-progress">
              <div className="progress-label">Running OCR... {ocrState.progress}%</div>
              <ProgressBar value={ocrState.progress} />
            </div>
          )}

          {/* OCR results */}
          {ocrState.status === 'done' && (
            <div className="ocr-section">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>Detected Type:</span>
                <span className="chip chip-active">{ocrState.docType}</span>
                {ocrState.flags.length > 0 && (
                  <span className={`chip ${ocrState.flags.some(f => f.severity==='reject') ? 'chip-reject' : 'chip-warn'}`}>
                    {ocrState.flags.length} Anomal{ocrState.flags.length === 1 ? 'y' : 'ies'}
                  </span>
                )}
                {ocrState.flags.length === 0 && <span className="chip chip-pass">All Clear</span>}
              </div>

              {/* Extracted fields */}
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--clr-text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Extracted Values</div>
              <div className="ocr-fields-grid">
                {FIELD_DISPLAY.map(f => {
                  const val = ocrState.fields[f.key];
                  if (val == null) return null;
                  const flag = ocrState.flags.find(fl => fl.field.toLowerCase().replace(' ','') === f.key.toLowerCase().replace(/[^a-z]/g,'') || fl.field === f.label);
                  const anomalyClass = flag ? (flag.severity === 'reject' ? 'anomaly-reject' : 'anomaly-warn') : '';
                  return (
                    <div key={f.key} className={`ocr-field ${anomalyClass}`}>
                      <div className="ocr-field-label">{f.label}</div>
                      <div className="ocr-field-value">{val} {f.unit}</div>
                    </div>
                  );
                })}
                {ocrState.fields.grade && (
                  <div className="ocr-field" style={{ gridColumn: '1 / -1' }}>
                    <div className="ocr-field-label">Grade</div>
                    <div className="ocr-field-value" style={{ fontSize: 13 }}>{ocrState.fields.grade}</div>
                  </div>
                )}
              </div>

              {/* Anomaly flags */}
              {ocrState.flags.length > 0 && (
                <div className="anomaly-list">
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--clr-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Anomaly Flags</div>
                  {ocrState.flags.map((flag, i) => (
                    <div key={i} className={`anomaly-item anomaly-${flag.severity}`}>
                      <div className="anomaly-icon">{flag.severity === 'reject' ? '🚫' : '⚠️'}</div>
                      <div className="anomaly-text">
                        <div className="anomaly-field-name">{flag.field}: {flag.value} {flag.unit}</div>
                        <div className="anomaly-detail">{flag.message}</div>
                      </div>
                      <span className={`chip ${flag.severity === 'reject' ? 'chip-reject' : 'chip-warn'}`} style={{ textTransform: 'uppercase', fontSize: 10 }}>{flag.severity}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* OCR raw text toggle */}
              <details style={{ marginTop: 12 }}>
                <summary style={{ fontSize: 12, cursor: 'pointer', color: 'var(--clr-text-muted)' }}>Raw OCR Text</summary>
                <pre style={{ fontSize: 11, fontFamily: 'var(--font-mono)', marginTop: 8, padding: 12, background: 'var(--clr-bg)', borderRadius: 4, overflowX: 'auto', whiteSpace: 'pre-wrap', border: '1px solid var(--clr-border)' }}>{ocrState.text}</pre>
              </details>
            </div>
          )}
        </div>

        {/* Inspection table */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--clr-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontWeight: 600, fontSize: 14 }}>Inspection Records</div>
            <span className="chip chip-pending">{filtered.length} records</span>
          </div>
          {/* Filters */}
          <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--clr-border)', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <input className="form-input" placeholder="Search ID, lot, location..." value={filterSearch} onChange={e => setFilterSearch(e.target.value)} style={{ width: 200 }} />
            <select className="form-input" value={filterStage} onChange={e => setFilterStage(e.target.value)} style={{ width: 150 }}>
              <option value="">All Stages</option>
              {Object.entries(STAGE_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <select className="form-input" value={filterCrop} onChange={e => setFilterCrop(e.target.value)} style={{ width: 120 }}>
              <option value="">All Crops</option>
              {CROPS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              <input type="checkbox" checked={filterAnomaly} onChange={e => setFilterAnomaly(e.target.checked)} />
              Anomalies only
            </label>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Lot ID</th>
                  <th>Crop</th>
                  <th>Location</th>
                  <th>Stage</th>
                  <th>QC Status</th>
                  <th>Volume (bu)</th>
                  <th>Submitted</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={9} style={{ textAlign: 'center', color: 'var(--clr-text-muted)', padding: 24 }}>No records match your filters.</td></tr>
                )}
                {filtered.map(ins => (
                  <tr key={ins.id} style={{ cursor: 'pointer', background: selectedId === ins.id ? '#F0F4FF' : '' }} onClick={() => setSelectedId(selectedId === ins.id ? null : ins.id)}>
                    <td className="mono">{ins.id}</td>
                    <td className="mono" style={{ fontSize: 12 }}>{ins.lotId}</td>
                    <td style={{ textTransform: 'capitalize' }}>{ins.crop}</td>
                    <td>{ins.location}</td>
                    <td><span className="chip chip-pending" style={{ fontSize: 10 }}>{STAGE_LABELS[ins.stage]}</span></td>
                    <td><InspectionStatus flags={ins.anomalyFlags} /></td>
                    <td className="mono">{ins.volume ? ins.volume.toLocaleString() : '--'}</td>
                    <td className="mono" style={{ fontSize: 11, color: 'var(--clr-text-muted)' }}>{ins.submittedAt ? ins.submittedAt.slice(0,10) : '--'}</td>
                    <td>
                      <button className="btn btn-ghost btn-sm" onClick={e => { e.stopPropagation(); setSelectedId(ins.id); }}>View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Detail panel */}
      {selected && (
        <div style={{ width: 360, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{selected.id}</div>
                <div style={{ fontSize: 11, color: 'var(--clr-text-muted)' }}>{selected.lotId}</div>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setSelectedId(null)}>Close</button>
            </div>
            <PipelineBar stage={selected.stage} />
            <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { label: 'Crop', value: selected.crop },
                { label: 'State', value: selected.state },
                { label: 'Volume', value: selected.volume ? selected.volume.toLocaleString() + ' bu' : '--' },
                { label: 'Field Team', value: selected.fieldTeam },
                { label: 'Grade', value: selected.grade || '--' },
                { label: 'Cert No.', value: selected.certNo || '--' },
              ].map(({ label, value }) => (
                <div key={label} style={{ background: 'var(--clr-bg)', padding: '8px 10px', borderRadius: 4 }}>
                  <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--clr-text-muted)' }}>{label}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 500, marginTop: 3 }}>{value}</div>
                </div>
              ))}
            </div>

            {/* Grading values */}
            {selected.moisture != null && (
              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--clr-text-muted)', marginBottom: 8 }}>Grading Values</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {[
                    { label: 'Moisture', value: selected.moisture, unit: '%' },
                    { label: 'Test Wt.', value: selected.testWeight, unit: 'lb/bu' },
                    { label: 'Aflatoxin', value: selected.aflatoxin, unit: 'ppb' },
                    { label: 'Foreign', value: selected.foreignMatter, unit: '%' },
                    { label: 'Damage', value: selected.totalDamage, unit: '%' },
                  ].filter(f => f.value != null).map(f => {
                    const flag = selected.anomalyFlags && selected.anomalyFlags.find(fl => fl.field.toLowerCase().includes(f.label.toLowerCase().slice(0,4)));
                    return (
                      <div key={f.label} className={`ocr-field ${flag ? 'anomaly-' + flag.severity : ''}`} style={{ flex: '1 1 calc(50% - 3px)', minWidth: 80 }}>
                        <div className="ocr-field-label">{f.label}</div>
                        <div className="ocr-field-value" style={{ fontSize: 14 }}>{f.value} {f.unit}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Anomaly flags */}
            {selected.anomalyFlags && selected.anomalyFlags.length > 0 && (
              <div className="anomaly-list" style={{ marginTop: 12 }}>
                {selected.anomalyFlags.map((flag, i) => (
                  <div key={i} className={`anomaly-item anomaly-${flag.severity}`}>
                    <div className="anomaly-icon">{flag.severity === 'reject' ? '🚫' : '⚠️'}</div>
                    <div className="anomaly-text">
                      <div className="anomaly-field-name">{flag.field}: {flag.value} {flag.unit}</div>
                      <div className="anomaly-detail">{flag.message}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {(canApprove || canLabReview) && selected.stage !== 'warehouse_allocation' && (
                <button className="btn btn-success btn-sm" onClick={() => advanceStage(selected.id)}>
                  Approve & Advance
                </button>
              )}
              <button className="btn btn-warn btn-sm" onClick={() => flagInspection(selected.id)}>
                Flag for Review
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
