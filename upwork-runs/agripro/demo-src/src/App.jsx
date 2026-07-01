import React, { useState } from 'react';
import RoleLogin from './components/RoleLogin.jsx';
import InspectionLab from './components/InspectionLab.jsx';
import ProcurementBoard from './components/ProcurementBoard.jsx';
import Dashboard from './components/Dashboard.jsx';
import { StatusChip } from './components/Shared.jsx';
import {
  CAMPAIGNS, INSPECTIONS_SEED, WAREHOUSE_BINS,
  AUDIT_LOG_SEED, NOTIFICATIONS_SEED, DOCUMENTS_SEED,
  STAGE_LABELS, STAGES
} from './data/mockData.js';

const STAGE_ICONS = { '📋': 'draft', '🔍': 'field_inspection', '🔬': 'lab_review', '✅': 'quality_approval', '📦': 'procurement_approval', '🏭': 'warehouse_allocation' };

const NAV = [
  { id: 'inspections',  label: 'Inspections',    icon: '🔬', roles: ['procurement','quality','warehouse','management'] },
  { id: 'procurement',  label: 'Procurement',     icon: '🌾', roles: ['procurement','management'] },
  { id: 'dashboards',   label: 'Dashboards',      icon: '📊', roles: ['procurement','quality','warehouse','management'] },
  { id: 'documents',    label: 'Documents',        icon: '📁', roles: ['procurement','quality','management'] },
  { id: 'warehouse',    label: 'Warehouse',        icon: '🏭', roles: ['warehouse','procurement','management'] },
  { id: 'audit',        label: 'Audit Log',        icon: '📋', roles: ['procurement','quality','warehouse','management'] },
  { id: 'admin',        label: 'Admin',            icon: '⚙️', roles: ['management'] },
];

export default function App() {
  const [role, setRole] = useState(null);
  const [activeTab, setActiveTab] = useState('inspections');
  const [inspections, setInspections] = useState(INSPECTIONS_SEED);
  const [auditLog, setAuditLog] = useState(AUDIT_LOG_SEED);
  const [notifications, setNotifications] = useState(NOTIFICATIONS_SEED);
  const [notifOpen, setNotifOpen] = useState(false);
  const [docFilter, setDocFilter] = useState('');

  if (!role) return <RoleLogin onSelect={r => { setRole(r); setActiveTab(r.navTabs[0] || 'inspections'); }} />;

  const unread = notifications.filter(n => !n.read).length;

  function appendAudit(entry) {
    const id = 'AUD-' + String(auditLog.length + 1).padStart(3, '0') + '-session';
    setAuditLog(prev => [{
      id, actor: role.label, role: role.id,
      action: entry.action, record: entry.record, detail: entry.detail,
      timestamp: new Date().toISOString()
    }, ...prev]);
  }

  function handleStageChange(insId, newStage) {
    setInspections(prev => prev.map(i => i.id === insId ? { ...i, stage: newStage } : i));
  }

  function markAllRead() {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }

  const allowedNav = NAV.filter(n => n.roles.includes(role.id));

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <nav className="app-nav">
        <div className="nav-logo">
          <div className="nav-logo-title">🌾 AgriPro</div>
          <div className="nav-logo-sub">Operations Console</div>
        </div>
        <div className="nav-section">
          <div className="nav-section-label">Navigation</div>
          {allowedNav.map(item => {
            const badge = item.id === 'inspections' ? inspections.filter(i=>i.anomalyFlags&&i.anomalyFlags.length>0).length : null;
            return (
              <div
                key={item.id}
                className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => setActiveTab(item.id)}
              >
                <span className="nav-icon">{item.icon}</span>
                {item.label}
                {badge > 0 && <span className="nav-badge">{badge}</span>}
              </div>
            );
          })}
        </div>
        <div className="nav-bottom">
          <div className="nav-user">
            <div className="nav-user-avatar" style={{ background: role.color }}>{role.label[0]}</div>
            <div>
              <div className="nav-user-name">{role.label}</div>
              <button
                style={{ fontSize: 10, background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: 0 }}
                onClick={() => setRole(null)}
              >Switch Role</button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main */}
      <div className="app-main">
        {/* Topbar */}
        <div className="app-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontWeight: 600, fontSize: 15 }}>
              {NAV.find(n => n.id === activeTab)?.label || activeTab}
            </span>
            <StatusChip status={role.id === 'quality' ? 'pass' : role.id === 'warehouse' ? 'active' : 'active'} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }}>
            <span style={{ fontSize: 12, color: 'var(--clr-text-muted)' }}>{role.label} View</span>
            <button className="notif-btn" onClick={() => setNotifOpen(o => !o)} title="Notifications">
              🔔
              {unread > 0 && <span className="notif-dot" />}
            </button>
            {notifOpen && (
              <div className="notif-tray">
                <div className="notif-header">
                  <h3>Notifications {unread > 0 && <span className="chip chip-reject" style={{ fontSize: 10, marginLeft: 6 }}>{unread}</span>}</h3>
                  <button className="btn btn-ghost btn-sm" onClick={markAllRead}>Mark all read</button>
                </div>
                {notifications.map(n => (
                  <div key={n.id} className={`notif-item ${n.read ? '' : 'unread'}`} onClick={() => {
                    setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x));
                    setNotifOpen(false);
                    if (n.relatedId && n.relatedId.startsWith('INS')) setActiveTab('inspections');
                  }}>
                    <div className={`notif-msg notif-type-${n.type}`}>
                      {n.type === 'anomaly' ? '🚨' : n.type === 'approval' ? '📋' : 'ℹ️'} {n.message}
                    </div>
                    <div className="notif-time">{n.createdAt.slice(0, 10)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="app-content">
          {activeTab === 'inspections' && (
            <InspectionLab
              inspections={inspections}
              onStageChange={handleStageChange}
              appendAudit={appendAudit}
              role={role.id}
            />
          )}

          {activeTab === 'procurement' && (
            <ProcurementBoard
              campaigns={CAMPAIGNS}
              inspections={inspections}
              onStageChange={handleStageChange}
              appendAudit={appendAudit}
              role={role.id}
            />
          )}

          {activeTab === 'dashboards' && (
            <Dashboard role={role.id} campaigns={CAMPAIGNS} inspections={inspections} bins={WAREHOUSE_BINS} />
          )}

          {activeTab === 'warehouse' && (
            <div>
              <div style={{ marginBottom: 20 }}>
                <div className="section-title">Warehouse Allocation</div>
                <div className="section-sub">Bin status and lot tracking across all facilities</div>
              </div>
              <div className="bin-grid">
                {WAREHOUSE_BINS.map(b => {
                  const pct = Math.round((b.allocated / b.maxCapacity) * 100);
                  const color = pct >= 90 ? 'var(--clr-reject)' : pct >= 70 ? 'var(--clr-warn)' : 'var(--clr-pass)';
                  return (
                    <div key={b.binId} className="card bin-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <div className="bin-title">{b.binId}</div>
                        <StatusChip status={b.status} />
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--clr-text-muted)', marginBottom: 4 }}>{b.commodity} · {b.location}</div>
                      <div className="bin-fill-track">
                        <div className="bin-fill-bar" style={{ width: `${pct}%`, background: color }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                        <span className="mono" style={{ fontSize: 12 }}>{b.allocated.toLocaleString()} bu</span>
                        <span className="bin-fill-pct" style={{ color }}>{pct}%</span>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--clr-text-muted)', marginTop: 4 }}>Capacity: {b.maxCapacity.toLocaleString()} bu</div>
                      {b.lotIds.length > 0 && (
                        <div style={{ marginTop: 8, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {b.lotIds.map(l => <span key={l} className="chip chip-draft" style={{ fontFamily: 'var(--font-mono)', fontSize: 10 }}>{l}</span>)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'documents' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <div className="section-title">Document Library</div>
                  <div className="section-sub">Lab certificates and grading documents</div>
                </div>
                <input className="form-input" placeholder="Filter documents..." value={docFilter} onChange={e => setDocFilter(e.target.value)} style={{ width: 200 }} />
              </div>
              <div className="card" style={{ overflow: 'hidden' }}>
                {DOCUMENTS_SEED.filter(d => !docFilter || d.name.toLowerCase().includes(docFilter.toLowerCase()) || d.type.toLowerCase().includes(docFilter.toLowerCase())).map(doc => (
                  <div key={doc.id} className="doc-item">
                    <div className="doc-icon">📄</div>
                    <div style={{ flex: 1 }}>
                      <div className="doc-name">{doc.name}</div>
                      <div className="doc-meta">{doc.type} · {doc.linkedId} · {doc.uploadedAt.slice(0,10)} · {doc.size}</div>
                    </div>
                    <StatusChip status={doc.status} />
                    <div className="doc-actions">
                      <button className="btn btn-secondary btn-sm" onClick={() => alert(`Viewing ${doc.name}`)}>View</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => {
                        appendAudit({ action: 'Document Downloaded', record: doc.linkedId, detail: doc.name });
                        alert(`Downloading ${doc.name}`);
                      }}>Download</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'audit' && (
            <div>
              <div style={{ marginBottom: 16 }}>
                <div className="section-title">Audit Log</div>
                <div className="section-sub">Full event history with actor, action, record, and timestamp</div>
              </div>
              <div className="card" style={{ overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Timestamp</th>
                        <th>Actor</th>
                        <th>Role</th>
                        <th>Action</th>
                        <th>Record</th>
                        <th>Detail</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLog.map(entry => (
                        <tr key={entry.id} className="audit-row">
                          <td className="mono">{entry.timestamp.replace('T',' ').slice(0,19)}</td>
                          <td>{entry.actor}</td>
                          <td><span className="chip chip-draft" style={{ fontSize: 10 }}>{entry.role}</span></td>
                          <td style={{ fontWeight: 500 }}>{entry.action}</td>
                          <td className="mono" style={{ fontSize: 12 }}>{entry.record}</td>
                          <td style={{ fontSize: 12, color: 'var(--clr-text-muted)' }}>{entry.detail}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'admin' && (
            <div>
              <div style={{ marginBottom: 20 }}>
                <div className="section-title">Admin Portal</div>
                <div className="section-sub">User management and system configuration (Management only)</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                {[
                  { label: 'Users', desc: '14 active platform users across 4 roles', icon: '👥', action: 'Manage Users' },
                  { label: 'Role Permissions', desc: 'Configure RBAC rules and approval gates', icon: '🔐', action: 'Edit Permissions' },
                  { label: 'Reference Bands', desc: 'Crop-specific anomaly detection thresholds', icon: '⚙️', action: 'Configure' },
                  { label: 'Notification Rules', desc: 'Alert triggers and recipient routing', icon: '🔔', action: 'Edit Rules' },
                  { label: 'Data Export', desc: 'Scheduled reports and data pipeline settings', icon: '📤', action: 'Configure' },
                  { label: 'System Health', desc: 'Platform status and API connectivity', icon: '🟢', action: 'View Status' },
                ].map(card => (
                  <div key={card.label} className="card" style={{ padding: 18 }}>
                    <div style={{ fontSize: 28, marginBottom: 10 }}>{card.icon}</div>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>{card.label}</div>
                    <div style={{ fontSize: 12, color: 'var(--clr-text-muted)', marginBottom: 14 }}>{card.desc}</div>
                    <button className="btn btn-secondary btn-sm" onClick={() => alert(`${card.action} panel (full build feature)`)}>{card.action}</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
