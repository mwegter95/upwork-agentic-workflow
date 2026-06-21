import React, { useEffect, useState } from 'react';
import { fetchBookings, fetchInventory, fetchWeather } from '../api';
import { useToast } from '../contexts/ToastContext';
import type { Booking, Unit, WeatherData } from '../api';

const WX_ICON: Record<number, string> = {
  0: '☀️', 1: '🌤', 2: '⛅', 3: '☁️',
  45: '🌫', 48: '🌫',
  51: '🌦', 53: '🌦', 55: '🌧',
  61: '🌧', 63: '🌧', 65: '🌧',
  80: '🌦', 81: '🌧', 82: '⛈',
  95: '⛈', 96: '⛈', 99: '⛈',
};
function wxIcon(code: number) { return WX_ICON[code] ?? (code >= 80 ? '⛈' : code >= 60 ? '🌧' : '🌡'); }

const STATUS_FLOW: Record<string, { label: string; next: string; color: string }> = {
  scheduled: { label: 'Scheduled', next: 'in_progress', color: 'var(--accent-blue)' },
  in_progress: { label: 'In Progress', next: 'complete', color: 'var(--warning)' },
  complete: { label: 'Complete', next: 'complete', color: 'var(--success)' },
  on_hold: { label: 'On Hold', next: 'scheduled', color: 'var(--error)' },
};

interface InstallJob {
  booking: Booking;
  unit?: Unit;
  installStatus: string;
  weather?: WeatherData;
  notes: string;
}

export default function OpsSchedule() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [jobs, setJobs] = useState<InstallJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [weatherCache, setWeatherCache] = useState<Record<number, WeatherData>>({});
  const [notesEditing, setNotesEditing] = useState<Record<number, string>>({});
  const [installStatuses, setInstallStatuses] = useState<Record<number, string>>({});
  const [filterStatus, setFilterStatus] = useState('');
  const [filterRisk, setFilterRisk] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'week'>('cards');
  const { toast } = useToast();

  useEffect(() => {
    Promise.all([fetchBookings({ status: 'confirmed' }), fetchInventory()])
      .then(([b, u]) => {
        setBookings(b); setUnits(u);
        const now = new Date();
        const in45 = new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000);
        const upcoming = b.filter((bk) => {
          const start = new Date(bk.start_date);
          return start >= new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000) && start <= in45;
        });
        const unitMap = Object.fromEntries(u.map((x) => [x.id, x]));
        const initial: InstallJob[] = upcoming.map((bk) => ({
          booking: bk, unit: unitMap[bk.unit_id], installStatus: 'scheduled', weather: undefined, notes: '',
        }));
        setJobs(initial);
        // Fetch weather for each unique unit_id in upcoming bookings
        const uniqueIds = [...new Set(upcoming.map((bk) => bk.unit_id))];
        Promise.allSettled(uniqueIds.map((id) => fetchWeather(id).then((wx) => ({ id, wx }))))
          .then((results) => {
            const cache: Record<number, WeatherData> = {};
            results.forEach((r) => { if (r.status === 'fulfilled') cache[r.value.id] = r.value.wx; });
            setWeatherCache(cache);
          });
      })
      .finally(() => setLoading(false));
  }, []);

  const getStatus = (j: InstallJob) => installStatuses[j.booking.id] ?? j.installStatus;
  const getWeather = (j: InstallJob) => weatherCache[j.booking.unit_id];
  const getInstallRisk = (j: InstallJob): 'HIGH' | 'LOW' | null => getWeather(j)?.current.install_risk ?? null;

  const advanceStatus = (bookingId: number) => {
    setInstallStatuses((prev) => {
      const cur = prev[bookingId] ?? 'scheduled';
      const next = STATUS_FLOW[cur]?.next ?? 'complete';
      toast(`Job status: ${STATUS_FLOW[next]?.label ?? next}`, 'success');
      return { ...prev, [bookingId]: next };
    });
  };

  const setNote = (bookingId: number, val: string) =>
    setNotesEditing((prev) => ({ ...prev, [bookingId]: val }));

  const getNote = (j: InstallJob) => notesEditing[j.booking.id] ?? j.notes;

  const daysUntil = (dateStr: string) => {
    const diff = new Date(dateStr).getTime() - new Date().setHours(0,0,0,0);
    return Math.round(diff / (1000 * 60 * 60 * 24));
  };

  const filtered = jobs.filter((j) => {
    if (filterStatus && getStatus(j) !== filterStatus) return false;
    if (filterRisk === 'HIGH' && getInstallRisk(j) !== 'HIGH') return false;
    if (filterRisk === 'LOW' && getInstallRisk(j) !== 'LOW') return false;
    return true;
  });

  const highRiskCount = jobs.filter((j) => getInstallRisk(j) === 'HIGH').length;
  const completedCount = jobs.filter((j) => getStatus(j) === 'complete').length;
  const inProgressCount = jobs.filter((j) => getStatus(j) === 'in_progress').length;

  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, marginBottom: 4 }}>Ops Schedule</h1>
        <span className="text-muted">Install queue for confirmed bookings starting within 45 days - weather-gated</span>
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        <div className="card" style={{ borderTop: '3px solid var(--accent-blue)' }}>
          <div className="form-label" style={{ marginBottom: 4 }}>Upcoming Installs</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, color: 'var(--accent-blue)' }}>{jobs.length}</div>
          <div className="text-muted text-sm">next 45 days</div>
        </div>
        <div className="card" style={{ borderTop: '3px solid var(--warning)' }}>
          <div className="form-label" style={{ marginBottom: 4 }}>In Progress</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, color: 'var(--warning)' }}>{inProgressCount}</div>
          <div className="text-muted text-sm">currently active</div>
        </div>
        <div className="card" style={{ borderTop: '3px solid var(--success)' }}>
          <div className="form-label" style={{ marginBottom: 4 }}>Completed</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, color: 'var(--success)' }}>{completedCount}</div>
          <div className="text-muted text-sm">of {jobs.length} jobs</div>
        </div>
        <div className="card" style={{ borderTop: `3px solid ${highRiskCount > 0 ? 'var(--error)' : 'var(--success)'}` }}>
          <div className="form-label" style={{ marginBottom: 4 }}>Weather Holds</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, color: highRiskCount > 0 ? 'var(--error)' : 'var(--success)' }}>{highRiskCount}</div>
          <div className="text-muted text-sm">HIGH risk units</div>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="toolbar" style={{ marginBottom: 20 }}>
        <select className="select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ maxWidth: 160 }}>
          <option value="">All Statuses</option>
          <option value="scheduled">Scheduled</option>
          <option value="in_progress">In Progress</option>
          <option value="complete">Complete</option>
          <option value="on_hold">On Hold</option>
        </select>
        <select className="select" value={filterRisk} onChange={(e) => setFilterRisk(e.target.value)} style={{ maxWidth: 160 }}>
          <option value="">All Risk</option>
          <option value="HIGH">HIGH Risk</option>
          <option value="LOW">LOW Risk</option>
        </select>
        {(filterStatus || filterRisk) && (
          <button className="btn btn-ghost btn-sm" onClick={() => { setFilterStatus(''); setFilterRisk(''); }}>Clear</button>
        )}
        <div className="view-toggle" style={{ marginLeft: 'auto' }}>
          <button className={`view-btn${viewMode === 'cards' ? ' active' : ''}`} onClick={() => setViewMode('cards')}>Cards</button>
          <button className={`view-btn${viewMode === 'week' ? ' active' : ''}`} onClick={() => setViewMode('week')}>Week</button>
        </div>
        <span className="text-muted text-sm">{filtered.length} of {jobs.length} jobs</span>
      </div>

      {/* Week calendar view */}
      {viewMode === 'week' && (() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const weekDays = Array.from({ length: 7 }, (_, i) => {
          const d = new Date(today.getTime() + i * 86400000);
          return d;
        });
        const dateStr = (d: Date) => d.toISOString().slice(0, 10);
        return (
          <div className="week-grid">
            {weekDays.map((day, idx) => {
              const ds = dateStr(day);
              const dayJobs = filtered.filter((j) => j.booking.start_date.slice(0, 10) === ds);
              const isToday = idx === 0;
              return (
                <div key={ds} className="week-col">
                  <div className={`week-col-header${isToday ? ' today' : ''}`}>
                    <div style={{ fontSize: 12, fontFamily: 'var(--font-display)' }}>{DAYS[day.getDay()]}</div>
                    <div style={{ fontSize: 18, color: isToday ? 'var(--accent)' : 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
                      {day.getDate()}
                    </div>
                    <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>
                      {day.toLocaleString('default', { month: 'short' })}
                    </div>
                  </div>
                  {dayJobs.length === 0 && (
                    <div style={{ padding: '8px 10px', color: 'var(--text-muted)', fontSize: 11 }}>No installs</div>
                  )}
                  {dayJobs.map((j) => {
                    const risk = getInstallRisk(j);
                    const status = getStatus(j);
                    const meta = STATUS_FLOW[status] ?? STATUS_FLOW['scheduled'];
                    const borderColor = risk === 'HIGH' ? 'var(--error)' : meta.color;
                    return (
                      <div
                        key={j.booking.id}
                        className="week-job-chip"
                        style={{ background: 'var(--bg-elevated)', borderLeftColor: borderColor }}
                        title={`${j.booking.unit_name} | ${j.booking.campaign_name} | ${meta.label}`}
                      >
                        <div style={{ fontWeight: 600, fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {j.booking.unit_name ?? `Unit ${j.booking.unit_id}`}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{meta.label}</div>
                        {risk === 'HIGH' && <div style={{ fontSize: 10, color: 'var(--error)', marginTop: 2 }}>⚠ Hold</div>}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* Jobs list (cards view) */}
      {viewMode === 'cards' && filtered.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-text">No install jobs in next 45 days</div>
          <div className="text-muted text-sm">Confirmed bookings with starts in the window will appear here</div>
        </div>
      )}

      <div style={{ display: viewMode === 'week' ? 'none' : 'flex', flexDirection: 'column', gap: 14 }}>
        {filtered.map((j) => {
          const wx = getWeather(j);
          const risk = getInstallRisk(j);
          const status = getStatus(j);
          const statusMeta = STATUS_FLOW[status] ?? STATUS_FLOW['scheduled'];
          const days = daysUntil(j.booking.start_date);
          const isUrgent = days <= 7;

          return (
            <div
              key={j.booking.id}
              className="card ops-job-card"
              style={{ borderLeft: `3px solid ${risk === 'HIGH' ? 'var(--error)' : statusMeta.color}` }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <span style={{ fontWeight: 600, fontSize: 15 }}>{j.booking.unit_name ?? `Unit ${j.booking.unit_id}`}</span>
                    <span className={`badge badge-${j.unit?.type ?? 'billboard'}`}>{j.unit?.type ?? '-'}</span>
                    <span className="text-muted text-sm">{j.booking.city ?? j.unit?.city ?? '-'}</span>
                    {isUrgent && <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--error)', textTransform: 'uppercase', letterSpacing: '.06em' }}>URGENT</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: 13, color: 'var(--text-muted)', marginBottom: 10 }}>
                    <span>Campaign: <strong style={{ color: 'var(--text-primary)' }}>{j.booking.campaign_name ?? '-'}</strong></span>
                    <span>Client: <strong style={{ color: 'var(--text-primary)' }}>{j.booking.client_name ?? '-'}</strong></span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                      {j.booking.start_date.slice(0, 10)} to {j.booking.end_date.slice(0, 10)}
                    </span>
                    <span style={{ color: isUrgent ? 'var(--error)' : days > 14 ? 'var(--success)' : 'var(--warning)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                      {days === 0 ? 'Today' : days < 0 ? `${Math.abs(days)}d ago` : `in ${days}d`}
                    </span>
                  </div>

                  {/* Weather risk row */}
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
                    {risk ? (
                      <>
                        <span className={`badge badge-risk-${risk.toLowerCase()}`}>
                          {risk === 'HIGH' ? '⚠ HIGH RISK' : '✓ LOW RISK'}
                        </span>
                        {wx && (
                          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                            {wxIcon(wx.current.weather_code)} {wx.current.temperature}°F, {wx.current.wind_speed} mph
                          </span>
                        )}
                        {wx && risk === 'HIGH' && (
                          <span style={{ fontSize: 12, color: 'var(--error)' }}>{wx.current.install_risk_reason}</span>
                        )}
                      </>
                    ) : (
                      <span className="text-muted text-sm">Loading weather...</span>
                    )}
                  </div>

                  {/* Notes */}
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input
                      className="input"
                      style={{ flex: 1, fontSize: 13 }}
                      placeholder="Add ops note (crew, equipment, access)..."
                      value={getNote(j)}
                      onChange={(e) => setNote(j.booking.id, e.target.value)}
                    />
                  </div>
                </div>

                {/* Right: status + action */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, minWidth: 140 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: statusMeta.color, textTransform: 'uppercase', letterSpacing: '.06em', padding: '4px 10px', background: 'var(--bg-elevated)', borderRadius: 4, border: `1px solid ${statusMeta.color}` }}>
                    {statusMeta.label}
                  </div>
                  {status !== 'complete' && (
                    <button
                      className="btn btn-primary btn-sm"
                      style={{ width: '100%' }}
                      onClick={() => advanceStatus(j.booking.id)}
                      disabled={risk === 'HIGH' && status === 'scheduled'}
                      title={risk === 'HIGH' && status === 'scheduled' ? 'Cannot start: HIGH weather risk' : undefined}
                    >
                      {status === 'scheduled' ? 'Start Install' : 'Mark Complete'}
                    </button>
                  )}
                  {status === 'scheduled' && risk !== 'HIGH' && (
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ width: '100%', color: 'var(--error)' }}
                      onClick={() => setInstallStatuses((prev) => { toast('Job placed on hold', 'warn'); return { ...prev, [j.booking.id]: 'on_hold' }; })}
                    >
                      Place on Hold
                    </button>
                  )}
                  {status === 'on_hold' && (
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ width: '100%' }}
                      onClick={() => setInstallStatuses((prev) => { toast('Job re-scheduled', 'info'); return { ...prev, [j.booking.id]: 'scheduled' }; })}
                    >
                      Re-schedule
                    </button>
                  )}
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    ${j.booking.monthly_rate.toLocaleString()}/mo
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
