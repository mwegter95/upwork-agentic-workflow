import { useState } from 'react';
import { useLeads } from './hooks/useLeads.js';
import { useWebGPU } from './hooks/useWebGPU.js';
import CRMTable from './components/CRMTable.jsx';
import DiscoveryPanel from './components/DiscoveryPanel.jsx';
import WebGPUPanel from './components/WebGPUPanel.jsx';

export default function App() {
  const [tab, setTab] = useState('crm');
  const [showDiscovery, setShowDiscovery] = useState(false);
  const [auditLog, setAuditLog] = useState([]);

  const { leads, loading, error, mode, stats, updateLead, addLeads, addSingleLead } = useLeads();

  // WebGPU state lifted to App so the model is shared between Discovery drawer and AI Audit tab
  const {
    gpuInfo, backend, modelReady, loading: gpuLoading,
    progress, progressMsg, error: gpuError,
    detectGPU, initModel, runAuditOnUrl,
  } = useWebGPU();

  return (
    <div className="cf-app">
      <nav className="cf-nav">
        <div className="cf-nav-brand">
          <span className="brand-dot" />
          Client Finder 1.0
        </div>
        <div className="cf-nav-tabs">
          <button className={`cf-nav-tab ${tab === 'crm' ? 'active' : ''}`} onClick={() => setTab('crm')}>
            CRM
            <span className="cf-badge-count" style={{ marginLeft: 6, fontSize: 10 }}>{leads.length}</span>
          </button>
          <button className={`cf-nav-tab ${tab === 'webgpu' ? 'active' : ''}`} onClick={() => setTab('webgpu')}>
            AI Audit
            {auditLog.length > 0 && (
              <span className="cf-badge-count" style={{ marginLeft: 6, fontSize: 10 }}>{auditLog.length}</span>
            )}
          </button>
        </div>
        <div className="cf-nav-right">
          <span style={{ fontSize: 11, color: 'var(--cf-subtext)' }}>MN B2B Lead Discovery</span>
          <span style={{
            fontSize: 10, padding: '2px 7px', borderRadius: 10, fontWeight: 600,
            background: mode === 'api' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
            color: mode === 'api' ? 'var(--cf-score-high)' : 'var(--cf-score-mid)',
          }}>
            {mode === 'api' ? '● Live API' : '● Local'}
          </span>
        </div>
      </nav>

      <div className="cf-main">
        {tab === 'crm' && (
          <CRMTable
            leads={leads}
            stats={stats}
            loading={loading}
            error={error}
            mode={mode}
            updateLead={updateLead}
            addSingleLead={addSingleLead}
            onDiscovery={() => setShowDiscovery(true)}
          />
        )}
        {tab === 'webgpu' && (
          <WebGPUPanel
            gpuInfo={gpuInfo}
            backend={backend}
            modelReady={modelReady}
            loading={gpuLoading}
            progress={progress}
            progressMsg={progressMsg}
            error={gpuError}
            detectGPU={detectGPU}
            initModel={initModel}
            auditLog={auditLog}
          />
        )}
      </div>

      {showDiscovery && (
        <DiscoveryPanel
          onClose={() => setShowDiscovery(false)}
          onLeadsAdded={(newLeads) => {
            addLeads(newLeads);
            setShowDiscovery(false);
          }}
          runAudit={modelReady ? runAuditOnUrl : null}
          gpuReady={modelReady}
          setAuditLog={setAuditLog}
        />
      )}
    </div>
  );
}
