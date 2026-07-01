import React, { useState } from 'react';
import { StatusChip, PipelineBar, EmptyState } from './Shared.jsx';
import { STAGES, STAGE_LABELS } from '../data/mockData.js';

const CROP_ICONS = { corn: '🌽', soybeans: '🫘', wheat: '🌾' };

export default function ProcurementBoard({ campaigns, inspections, onStageChange, appendAudit, role }) {
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');

  const canAct = role === 'procurement' || role === 'management';

  const filteredCampaigns = filterStatus ? campaigns.filter(c => c.status === filterStatus) : campaigns;
  const campaignInspections = selectedCampaign ? inspections.filter(i => i.campaignId === selectedCampaign.id) : [];

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

  function rejectInspection(insId) {
    appendAudit({ action: 'Rejected', record: insId, detail: 'Procurement rejection' });
    alert('Inspection rejected. Returned to lab review queue.');
  }

  return (
    <div style={{ display: 'flex', gap: 24, height: '100%' }}>
      {/* Campaign board */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div className="section-title">Procurement Campaigns</div>
            <div className="section-sub">Active buying campaigns across states and crops</div>
          </div>
          <select className="form-input" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ width: 140 }}>
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="review">Review</option>
            <option value="completed">Completed</option>
            <option value="draft">Draft</option>
          </select>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {filteredCampaigns.map(c => {
            const pct = c.targetVolume > 0 ? Math.round((c.procuredVolume / c.targetVolume) * 100) : 0;
            const isSelected = selectedCampaign?.id === c.id;
            return (
              <div
                key={c.id}
                className="card"
                style={{ padding: 16, cursor: 'pointer', borderColor: isSelected ? 'var(--clr-action)' : '', borderWidth: isSelected ? 2 : 1, transition: 'border-color 0.15s' }}
                onClick={() => setSelectedCampaign(isSelected ? null : c)}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600 }}>{CROP_ICONS[c.crop] || '🌾'} {c.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--clr-text-muted)', marginTop: 3 }}>{c.id} · {c.state} · {c.crop}</div>
                  </div>
                  <StatusChip status={c.status} />
                </div>
                {/* Volume bar */}
                <div style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 11, color: 'var(--clr-text-muted)' }}>Volume</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 500 }}>{pct}%</span>
                  </div>
                  <div style={{ height: 6, background: 'var(--clr-tag-bg)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: pct >= 90 ? 'var(--clr-pass)' : 'var(--clr-action)', borderRadius: 3 }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--clr-text-muted)' }}>{c.procuredVolume.toLocaleString()} bu</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--clr-text-muted)' }}>{c.targetVolume.toLocaleString()} bu target</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12, fontSize: 12 }}>
                  <span style={{ color: 'var(--clr-text-muted)' }}>Inspections: <strong>{c.inspectionCount}</strong></span>
                  {c.pendingApprovals > 0 && (
                    <span style={{ color: 'var(--clr-warn)', fontWeight: 600 }}>{c.pendingApprovals} pending</span>
                  )}
                  <span style={{ color: 'var(--clr-text-muted)', marginLeft: 'auto' }}>Mgr: {c.manager}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Approval pipeline */}
      {selectedCampaign && (
        <div style={{ width: 400, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="card" style={{ padding: '12px 16px', borderLeft: '4px solid var(--clr-action)' }}>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{selectedCampaign.name}</div>
            <div style={{ fontSize: 12, color: 'var(--clr-text-muted)', marginTop: 2 }}>Approval Pipeline</div>
          </div>
          {campaignInspections.length === 0 && <EmptyState icon="📋" message="No inspections for this campaign." />}
          {campaignInspections.map(ins => (
            <div key={ins.id} className="card" style={{ padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{ins.lotId}</div>
                  <div style={{ fontSize: 11, color: 'var(--clr-text-muted)' }}>{ins.id} · {ins.location}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  {ins.anomalyFlags && ins.anomalyFlags.length > 0 && (
                    <span className={`chip ${ins.anomalyFlags.some(f=>f.severity==='reject') ? 'chip-reject' : 'chip-warn'}`} style={{ fontSize: 10 }}>
                      {ins.anomalyFlags.length} flag{ins.anomalyFlags.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
              <PipelineBar stage={ins.stage} />
              <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {ins.stage !== 'warehouse_allocation' && canAct && (
                  <button className="btn btn-success btn-sm" onClick={() => advanceStage(ins.id)}>
                    Approve
                  </button>
                )}
                {ins.stage === 'warehouse_allocation' && (
                  <span className="chip chip-pass">Complete</span>
                )}
                {canAct && ins.stage !== 'warehouse_allocation' && (
                  <button className="btn btn-danger btn-sm" onClick={() => rejectInspection(ins.id)}>
                    Reject
                  </button>
                )}
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--clr-text-muted)', alignSelf: 'center', marginLeft: 'auto' }}>
                  {ins.volume ? ins.volume.toLocaleString() + ' bu' : '--'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
