import { scoreColor, statusClass } from '../utils/auditUtils.js';

export function ScoreChip({ score, size = 'sm' }) {
  if (score == null || isNaN(score)) return <span style={{ color: 'var(--cf-muted)', fontSize: 12 }}>—</span>;
  const s = Number(score);
  return (
    <span
      className="cf-chip cf-score-chip"
      style={{ background: scoreColor(s), fontSize: size === 'lg' ? 14 : 12 }}
    >
      {s.toFixed(1)}
    </span>
  );
}

export function StatusBadge({ status }) {
  const cls = statusClass(status);
  const label = status === 'In Progress' ? 'In Progress' : status;
  return <span className={`cf-chip cf-status-chip ${cls}`}>{label}</span>;
}

export function ScoreBar({ score, label }) {
  const s = Number(score) || 0;
  const pct = (s / 10) * 100;
  return (
    <div className="cf-score-row">
      <span className="score-label">{label}</span>
      <div className="cf-score-bar-wrap">
        <div className="cf-score-bar" style={{ width: `${pct}%`, background: scoreColor(s) }} />
      </div>
      <ScoreChip score={s} />
    </div>
  );
}
