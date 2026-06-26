import { useEffect } from 'react';

const QUERY_ARCH = `<span class="kw">import</span> { pipeline } <span class="kw">from</span> <span class="str">'@huggingface/transformers'</span>;

<span class="cm">// Lazy-loaded once, cached in the browser after first run</span>
<span class="kw">const</span> llm = <span class="kw">await</span> pipeline(
  <span class="str">'text-generation'</span>,
  <span class="str">'onnx-community/Llama-3.2-1B-Instruct'</span>,
  { device: <span class="str">'webgpu'</span> }  <span class="cm">// fallback: 'wasm'</span>
);

<span class="cm">// At the start of a Discovery run:</span>
<span class="kw">const</span> out = <span class="kw">await</span> llm([
  { role: <span class="str">'system'</span>, content: <span class="str">'Write search queries…'</span> },
  { role: <span class="str">'user'</span>,   content: <span class="str">'8 diverse MN business queries'</span> },
]);
<span class="cm">// → ["dental clinic Rochester MN", "auto repair Duluth MN", …]</span>`;

const NAV_ARCH = `<span class="cm">// Before rescraping a lead, the model picks which pages matter:</span>
<span class="kw">const</span> navKeywords = <span class="kw">await</span> generateNavPlan({ industry });
<span class="cm">// → ["about", "services", "contact", "pricing"]</span>

<span class="cm">// Playwright then visits + screenshots those pages and records</span>
<span class="cm">// deterministic quality notes (HTTPS, responsive, stack, contacts).</span>
<span class="cm">// The model never analyzes the screenshots — only guides navigation.</span>`;

export default function WebGPUPanel({
  gpuInfo, backend, modelReady, loading, progress, progressMsg, error,
  detectGPU, initModel,
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
            The model falls back to <strong style={{ color: 'var(--cf-score-mid)' }}>CPU/WASM</strong> (slower). Discovery still works with the built-in query planner.
          </div>
        )}

        {!loading && (
          <button className="cf-btn cf-btn-primary" style={{ marginTop: 12, fontSize: 12 }} onClick={initModel}>
            {modelReady ? '✓ Language model ready — Re-initialize' : 'Initialize Llama-3.2-1B for AI queries'}
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
        <h3>How the AI Engine Is Used</h3>
        <div style={{ fontSize: 12, color: 'var(--cf-subtext)', lineHeight: 1.6, marginBottom: 12 }}>
          A small language model runs <strong style={{ color: 'var(--cf-text)' }}>entirely in this browser tab</strong> (WebGPU, zero server cost).
          It does two things: it writes smarter, more varied search queries for Discovery, and it decides which
          internal pages Playwright should visit and screenshot. It does <strong style={{ color: 'var(--cf-text)' }}>not</strong> analyze the
          screenshots — website-quality notes come from deterministic Playwright checks.
        </div>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--cf-subtext)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Smarter search queries</div>
        <div className="cf-arch-code" dangerouslySetInnerHTML={{ __html: QUERY_ARCH }} />
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--cf-subtext)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '14px 0 6px' }}>AI-guided navigation</div>
        <div className="cf-arch-code" dangerouslySetInnerHTML={{ __html: NAV_ARCH }} />
      </div>
    </div>
  );
}
