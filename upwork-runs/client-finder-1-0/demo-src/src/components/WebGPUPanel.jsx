import { useEffect } from 'react';
import { scoreColor } from '../utils/auditUtils.js';

const BROWSER_ARCH = `<span class="kw">import</span> { pipeline } <span class="kw">from</span> <span class="str">'@huggingface/transformers'</span>;

<span class="cm">// Lazy-loaded once — 256MB, cached in IndexedDB after first run</span>
<span class="kw">const</span> pipe = <span class="kw">await</span> pipeline(
  <span class="str">'image-text-to-text'</span>,
  <span class="str">'HuggingFaceTB/SmolVLM-256M-Instruct'</span>,
  { device: <span class="str">'webgpu'</span> }  <span class="cm">// fallback: 'wasm'</span>
);

<span class="cm">// Called for each Playwright screenshot during discovery:</span>
<span class="kw">const</span> result = <span class="kw">await</span> pipe([{
  role: <span class="str">'user'</span>,
  content: [
    { type: <span class="str">'image'</span>, image: screenshotUrl },
    { type: <span class="str">'text'</span>,  text: auditPrompt },
  ]
}]);
<span class="cm">// → { modernity, mobile, function, notes, outdated_signs }</span>`;

const REFINEMENT_ARCH = `<span class="cm">// After auditing each batch of N screenshots:</span>
<span class="kw">const</span> avgScore = batch.reduce((s,x) => s + x.composite, 0) / N;

<span class="cm">// If sites look too modern → refine toward older-stack targets</span>
<span class="kw">if</span> (avgScore > <span class="str">5.5</span>) {
  nextQuery = {
    industry: <span class="str">'Manufacturing & Logistics'</span>,
    city:     <span class="str">'St. Cloud MN'</span>,
  };
  <span class="cm">// Next Serper round uses these refined params…</span>
}`;

export default function WebGPUPanel({
  gpuInfo, backend, modelReady, loading, progress, progressMsg, error,
  detectGPU, initModel, auditLog,
}) {
  useEffect(() => { detectGPU(); }, []);
  const isIframe = typeof window !== 'undefined' && window.self !== window.top;

  return (
    <div className="cf-webgpu-panel">
      {isIframe && (
        <div className="cf-iframe-warn">
          <div className="cf-iframe-warn-icon">⚠️</div>
          <div className="cf-iframe-warn-text">
            <strong>WebGPU inference requires direct browser access.</strong>{' '}
            <a href="/demos/client-finder-1-0/" target="_blank" rel="noreferrer" style={{ color: 'var(--cf-primary)', fontWeight: 600 }}>
              Open Full Demo ↗
            </a>
          </div>
        </div>
      )}

      {/* GPU status + init */}
      <div className="cf-card">
        <h3>WebGPU Status <span className="cf-tag">navigator.gpu</span></h3>
        {!gpuInfo && <div className="cf-gpu-status checking"><div className="cf-gpu-dot" /><div className="cf-gpu-label">Detecting…</div></div>}
        {gpuInfo && (
          <div className={`cf-gpu-status ${gpuInfo.available ? 'available' : 'unavailable'}`}>
            <div className="cf-gpu-dot" />
            <div className="cf-gpu-label">{gpuInfo.available ? 'WebGPU Available' : 'WebGPU Unavailable'}</div>
            <div className="cf-gpu-sub">{gpuInfo.available ? `Backend: WebGPU (${backend})` : `Fallback: WASM (${backend})`}</div>
          </div>
        )}
        {gpuInfo?.available && (
          <div className="cf-gpu-info-grid">
            {[
              { key: 'Vendor', val: gpuInfo.vendor },
              { key: 'Architecture', val: gpuInfo.architecture },
              { key: 'Device', val: gpuInfo.device || 'Default' },
              { key: 'Max Buffer', val: gpuInfo.maxBufferSize },
            ].map(({ key, val }) => (
              <div key={key} className="cf-gpu-info-item">
                <div className="key">{key}</div><div className="val">{val || '—'}</div>
              </div>
            ))}
          </div>
        )}
        {gpuInfo && !gpuInfo.available && (
          <div style={{ fontSize: 12, color: 'var(--cf-subtext)', marginTop: 8, lineHeight: 1.5 }}>
            {gpuInfo.reason}<br />
            Audit falls back to <strong style={{ color: 'var(--cf-score-mid)' }}>CPU/WASM</strong>. Scores still guide search refinement.
          </div>
        )}

        {!loading && (
          <button className="cf-btn cf-btn-primary" style={{ marginTop: 12, fontSize: 12 }} onClick={initModel}>
            {modelReady ? '✓ SmolVLM ready — Re-initialize' : 'Initialize SmolVLM-256M for Discovery'}
          </button>
        )}
        {loading && (
          <div className="cf-progress-wrap" style={{ marginTop: 12 }}>
            <div className="cf-progress-label">
              <span>{progressMsg}</span>
              <span style={{ color: 'var(--cf-primary)', fontWeight: 600 }}>{progress}%</span>
            </div>
            <div className="cf-progress-bar-track">
              <div className="cf-progress-bar-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}
        {error && <div style={{ fontSize: 12, color: 'var(--cf-score-low)', marginTop: 8 }}>Error: {error}</div>}
      </div>

      {/* How it's integrated */}
      <div className="cf-card">
        <h3>How It Integrates into Discovery</h3>
        <div style={{ fontSize: 12, color: 'var(--cf-subtext)', lineHeight: 1.6, marginBottom: 12 }}>
          During a Discovery run, SmolVLM audits each Playwright screenshot <strong style={{ color: 'var(--cf-text)' }}>live in this browser tab</strong> — zero server cost.
          The resulting scores drive query refinement: if a batch of sites scores too high (modern sites),
          the next Serper round targets older-skewing industries and smaller MN markets.
        </div>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--cf-subtext)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Per-screenshot inference</div>
        <div className="cf-arch-code" dangerouslySetInnerHTML={{ __html: BROWSER_ARCH }} />
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--cf-subtext)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '14px 0 6px' }}>Search refinement</div>
        <div className="cf-arch-code" dangerouslySetInnerHTML={{ __html: REFINEMENT_ARCH }} />
      </div>

      {/* Audit log */}
      <div className="cf-card">
        <h3>Audit Log <span className="cf-tag">{auditLog.length} sites</span></h3>
        {auditLog.length === 0 ? (
          <div style={{ fontSize: 12, color: 'var(--cf-muted)', textAlign: 'center', padding: '20px 0' }}>
            No audits yet — run Discovery to see live results here.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {auditLog.map(entry => (
              <div key={entry.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '10px 12px', background: 'var(--cf-surface-2)', border: '1px solid var(--cf-border)', borderRadius: 'var(--cf-radius-md)' }}>
                {entry.screenshot_url && (
                  <img
                    src={entry.screenshot_url.startsWith('http') ? entry.screenshot_url : `https://api.michaelwegter.com${entry.screenshot_url}`}
                    alt=""
                    style={{ width: 64, height: 40, objectFit: 'cover', borderRadius: 3, flexShrink: 0 }}
                    onError={e => { e.target.style.display = 'none'; }}
                  />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 500, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--cf-subtext)', marginBottom: 4 }}>{entry.website}</div>
                  <div style={{ display: 'flex', gap: 10, fontSize: 11 }}>
                    {[{ label:'Modern', val:entry.modernity },{ label:'Mobile', val:entry.mobile },{ label:'Func', val:entry.function }].map(({ label, val }) => (
                      <span key={label} style={{ color: 'var(--cf-subtext)' }}>
                        {label}: <strong style={{ color: scoreColor(val) }}>{val}</strong>
                      </span>
                    ))}
                  </div>
                  {entry.notes && <div style={{ fontSize: 11, color: 'var(--cf-subtext)', marginTop: 4, lineHeight: 1.4 }}>{entry.notes.slice(0,120)}{entry.notes.length>120?'…':''}</div>}
                  <div style={{ fontSize: 10, color: 'var(--cf-muted)', marginTop: 4 }}>{entry.backend?.toUpperCase()} · {new Date(entry.ts).toLocaleTimeString()}</div>
                </div>
                <div style={{ textAlign: 'center', width: 36, flexShrink: 0 }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: scoreColor(entry.composite), fontFamily: 'JetBrains Mono' }}>{entry.composite}</div>
                  <div style={{ fontSize: 9, color: 'var(--cf-muted)' }}>/10</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
