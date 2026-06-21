import React from 'react';

interface KpiCardProps {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
  icon?: string;
  trend?: { dir: 'up' | 'down'; pct: number };
}

export default function KpiCard({ label, value, sub, color, icon, trend }: KpiCardProps) {
  return (
    <div className="card" style={{ borderTop: `3px solid ${color ?? 'var(--accent)'}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="form-label" style={{ marginBottom: 6 }}>{label}</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: color ?? 'var(--text-primary)', lineHeight: 1 }}>
            {value}
          </div>
          {sub && <div className="text-muted text-sm" style={{ marginTop: 6 }}>{sub}</div>}
          {trend && (
            <div className={`kpi-trend kpi-trend-${trend.dir}`}>
              {trend.dir === 'up' ? '▲' : '▼'} {trend.pct}% vs prior period
            </div>
          )}
        </div>
        {icon && <span style={{ fontSize: 22, opacity: 0.5, marginLeft: 8, flexShrink: 0 }}>{icon}</span>}
      </div>
    </div>
  );
}
