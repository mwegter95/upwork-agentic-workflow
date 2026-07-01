import React from 'react';
import { STAGE_LABELS, STAGES } from '../data/mockData.js';

// StatusChip
export function StatusChip({ status }) {
  const map = {
    active:      { cls: 'chip-active',    label: 'Active' },
    completed:   { cls: 'chip-completed', label: 'Completed' },
    review:      { cls: 'chip-review',    label: 'Review' },
    draft:       { cls: 'chip-draft',     label: 'Draft' },
    pass:        { cls: 'chip-pass',      label: 'Pass' },
    warn:        { cls: 'chip-warn',      label: 'Warning' },
    reject:      { cls: 'chip-reject',    label: 'Reject' },
    pending:     { cls: 'chip-pending',   label: 'Pending' },
    verified:    { cls: 'chip-pass',      label: 'Verified' },
    flagged:     { cls: 'chip-reject',    label: 'Flagged' },
    'near-full': { cls: 'chip-warn',      label: 'Near Full' },
    empty:       { cls: 'chip-draft',     label: 'Empty' },
  };
  const { cls, label } = map[status] || { cls: 'chip-draft', label: status };
  return <span className={`chip ${cls}`}>{label}</span>;
}

// PipelineBar
export function PipelineBar({ stage }) {
  const idx = STAGES.indexOf(stage);
  return (
    <div className="pipeline-bar">
      {STAGES.map((s, i) => {
        let cls = '';
        if (i < idx) cls = 'completed';
        else if (i === idx) cls = 'active';
        return (
          <div key={s} className={`pipeline-step ${cls}`} title={STAGE_LABELS[s]}>
            {STAGE_LABELS[s]}
          </div>
        );
      })}
    </div>
  );
}

// Progress bar
export function ProgressBar({ value }) {
  return (
    <div className="progress-bar-track">
      <div className="progress-bar-fill" style={{ width: `${Math.min(100, value)}%` }} />
    </div>
  );
}

// Inspection status badge based on anomaly flags
export function InspectionStatus({ flags }) {
  if (!flags || flags.length === 0) return <StatusChip status="pass" />;
  const hasReject = flags.some(f => f.severity === 'reject');
  if (hasReject) return <StatusChip status="reject" />;
  return <StatusChip status="warn" />;
}

// Simple empty state
export function EmptyState({ icon, message }) {
  return (
    <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--clr-text-muted)' }}>
      <div style={{ fontSize: 32, marginBottom: 10 }}>{icon}</div>
      <div style={{ fontSize: 13 }}>{message}</div>
    </div>
  );
}
