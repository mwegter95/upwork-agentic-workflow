import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  AreaChart, Area,
} from 'recharts';
import KpiCard from '../components/KpiCard';
import { fetchInventory, fetchCampaigns, fetchBookings, approveBooking, rejectBooking } from '../api';
import { useAlerts } from '../contexts/AlertsContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import type { Unit, Campaign, Booking } from '../api';

const ACTIVITY = [
  { text: 'New booking confirmed: Busch Gardens: Channelside Bay Plaza Digital', time: '2 min ago' },
  { text: 'Campaign "Ford Summer Sales Event" status updated to Active', time: '14 min ago' },
  { text: 'Unit SR-60 Causeway East placed in Maintenance', time: '1 hr ago' },
  { text: 'New client added: Tampa General Hospital', time: '2 hr ago' },
  { text: 'Booking conflict flagged: Dale Mabry & Kennedy overlap detected', time: '3 hr ago' },
  { text: 'Weather alert: High wind risk at I-275 North Gateway (install hold)', time: '4 hr ago' },
  { text: 'Campaign "Visit St. Pete Fall Push" created by sarah@adverteyes.com', time: 'Yesterday' },
  { text: 'User ops@adverteyes.com role updated to Ops/Installer', time: 'Yesterday' },
];

const revenueWeeks = [
  { week: 'Apr W3', revenue: 38200 }, { week: 'Apr W4', revenue: 41600 },
  { week: 'May W1', revenue: 44000 }, { week: 'May W2', revenue: 48500 },
  { week: 'May W3', revenue: 53100 }, { week: 'May W4', revenue: 58400 },
  { week: 'Jun W1', revenue: 62800 }, { week: 'Jun W2', revenue: 68200 },
];

export default function Dashboard() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartTab, setChartTab] = useState<'inventory' | 'revenue'>('inventory');
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const { setMaintenanceUnits } = useAlerts();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [rateUnit, setRateUnit] = useState<Unit | null>(null);
  const [rateWeeks, setRateWeeks] = useState(4);
  const canApprove = user?.role === 'admin' || user?.role === 'sales';

  const handleQuickApprove = async (b: Booking) => {
    setApprovingId(b.id);
    try {
      await approveBooking(b.id);
      setBookings((prev) => prev.map((x) => x.id === b.id ? { ...x, status: 'confirmed' } : x));
      toast(`Approved: ${b.unit_name ?? 'booking'}`, 'success');
    } catch { toast('Approval failed', 'error'); }
    finally { setApprovingId(null); }
  };

  const handleQuickReject = async (b: Booking) => {
    if (!confirm(`Reject booking for "${b.unit_name ?? 'this unit'}"?`)) return;
    setApprovingId(b.id);
    try {
      await rejectBooking(b.id);
      setBookings((prev) => prev.map((x) => x.id === b.id ? { ...x, status: 'cancelled' } : x));
      toast('Booking rejected', 'warn');
    } catch { toast('Reject failed', 'error'); }
    finally { setApprovingId(null); }
  };

  useEffect(() => {
    Promise.all([fetchInventory(), fetchCampaigns(), fetchBookings()])
      .then(([u, c, b]) => {
        setUnits(u); setCampaigns(c); setBookings(b);
        setMaintenanceUnits(u.filter((x) => x.status === 'maintenance').length);
      })
      .finally(() => setLoading(false));
  }, [setMaintenanceUnits]);

  const total = units.length || 1;
  const booked = units.filter((u) => u.status === 'booked').length;
  const occupancy = Math.round((booked / total) * 100);
  const activeCampaigns = campaigns.filter((c) => c.status === 'active').length;
  const revenueMTD = bookings
    .filter((b) => b.status === 'confirmed')
    .reduce((sum, b) => sum + (b.monthly_rate ?? 0), 0);

  const chartData = (['billboard', 'dooh', 'truckside'] as const).map((type) => {
    const group = units.filter((u) => u.type === type);
    return {
      type: type === 'dooh' ? 'DOOH' : type.charAt(0).toUpperCase() + type.slice(1),
      Booked: group.filter((u) => u.status === 'booked').length,
      Available: group.filter((u) => u.status === 'available').length,
      Maintenance: group.filter((u) => u.status === 'maintenance').length,
    };
  });

  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, marginBottom: 4 }}>Dashboard</h1>
          <span className="text-muted">OOH ops overview, Tampa Bay market</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: 'var(--success)' }}>
            <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 4px var(--success)', animation: 'pulse 2s infinite' }} />
            Live
          </span>
          <span className="text-muted">Updated {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          <button
            className="btn btn-ghost btn-sm"
            style={{ fontSize: 12 }}
            onClick={() => {
              setLoading(true);
              Promise.all([fetchInventory(), fetchCampaigns(), fetchBookings()])
                .then(([u, c, b]) => { setUnits(u); setCampaigns(c); setBookings(b); setMaintenanceUnits(u.filter((x) => x.status === 'maintenance').length); })
                .finally(() => setLoading(false));
            }}
          >
            ↺ Refresh
          </button>
        </div>
      </div>

      <div className="kpi-grid">
        <KpiCard label="Total Ad Units" value={units.length} icon="◉" color="var(--accent)" sub={`${booked} booked, ${units.filter((u) => u.status === 'available').length} available`} trend={{ dir: 'up', pct: 5 }} />
        <KpiCard label="Occupancy Rate" value={`${occupancy}%`} icon="◆" color="var(--success)" sub="Active bookings / total units" trend={{ dir: 'up', pct: 3 }} />
        <KpiCard label="Active Campaigns" value={activeCampaigns} icon="◈" color="var(--accent-blue)" sub={`${campaigns.length} total campaigns`} trend={{ dir: 'up', pct: 12 }} />
        <KpiCard label="Est. Revenue MTD" value={`$${revenueMTD.toLocaleString()}`} icon="◎" color="var(--warning)" sub="Confirmed booking rates" trend={{ dir: 'up', pct: 8 }} />
        <KpiCard label="Pending Bookings" value={bookings.filter((b) => b.status === 'pending').length} icon="◎" color="var(--error)" sub="Awaiting approval" trend={{ dir: 'down', pct: 2 }} />
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <div className="card-header">
            <span className="card-title">{chartTab === 'inventory' ? 'Inventory Status by Type' : 'Revenue Trend: Last 8 Weeks'}</span>
            <div className="view-toggle">
              <button className={`view-btn${chartTab === 'inventory' ? ' active' : ''}`} onClick={() => setChartTab('inventory')}>Inventory</button>
              <button className={`view-btn${chartTab === 'revenue' ? ' active' : ''}`} onClick={() => setChartTab('revenue')}>Revenue</button>
            </div>
          </div>
          {chartTab === 'inventory' ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData} barCategoryGap="35%" barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="type" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12, color: 'var(--text-primary)' }}
                  cursor={{ fill: 'rgba(255,107,26,0.05)' }}
                />
                <Bar dataKey="Booked" fill="var(--accent)" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Available" fill="var(--accent-blue)" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Maintenance" fill="var(--warning)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={revenueWeeks}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="week" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12, color: 'var(--text-primary)' }}
                  formatter={(v: number) => [`$${v.toLocaleString()}`, 'Revenue']}
                />
                <Area type="monotone" dataKey="revenue" stroke="var(--accent)" strokeWidth={2} fill="url(#revGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Recent Activity</span>
          </div>
          {ACTIVITY.map((a, i) => (
            <div key={i} className="activity-item">
              <div className="activity-dot" />
              <div>
                <div className="activity-text">{a.text}</div>
                <div className="activity-time">{a.time}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Upcoming Milestones */}
        {(() => {
          const now = new Date();
          const in14 = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
          type Milestone = { date: string; label: string; type: 'start' | 'end'; color: string };
          const milestones: Milestone[] = [];
          campaigns.forEach((c) => {
            const start = new Date(c.start_date);
            const end   = new Date(c.end_date);
            if (start >= now && start <= in14) milestones.push({ date: c.start_date.slice(0,10), label: `${c.name} starts`, type: 'start', color: 'var(--success)' });
            if (end >= now && end <= in14) milestones.push({ date: c.end_date.slice(0,10), label: `${c.name} ends`, type: 'end', color: 'var(--warning)' });
          });
          bookings.forEach((b) => {
            const start = new Date(b.start_date);
            const end   = new Date(b.end_date);
            if (start >= now && start <= in14) milestones.push({ date: b.start_date.slice(0,10), label: `${b.unit_name ?? 'Booking'}: ${b.campaign_name ?? ''} starts`, type: 'start', color: 'var(--accent-blue)' });
            if (end >= now && end <= in14) milestones.push({ date: b.end_date.slice(0,10), label: `${b.unit_name ?? 'Booking'} ends`, type: 'end', color: 'var(--error)' });
          });
          milestones.sort((a, b) => a.date.localeCompare(b.date));
          const unique = milestones.filter((m, i, arr) => arr.findIndex((x) => x.date === m.date && x.label === m.label) === i).slice(0, 10);
          if (unique.length === 0) return null;
          return (
            <div className="card" style={{ gridColumn: '1 / -1' }}>
              <div className="card-header">
                <span className="card-title">Upcoming Milestones</span>
                <span className="text-muted text-sm">Next 14 days</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 8 }}>
                {unique.map((m, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius)', borderLeft: `3px solid ${m.color}` }}>
                    <div style={{ flex: 0, textAlign: 'center', minWidth: 44 }}>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{m.date.slice(5)}</div>
                      <div style={{ fontSize: 16 }}>{m.type === 'start' ? '▶' : '■'}</div>
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.label}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Alerts Panel */}
        {(() => {
          const maintenance = units.filter((u) => u.status === 'maintenance');
          const pending = bookings.filter((b) => b.status === 'pending');
          const now = new Date();
          const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
          const expiring = campaigns.filter((c) => {
            const end = new Date(c.end_date);
            return c.status === 'active' && end >= now && end <= in30;
          });
          const hasAlerts = maintenance.length > 0 || pending.length > 0 || expiring.length > 0;
          if (!hasAlerts) return null;
          return (
            <div className="card" style={{ gridColumn: '1 / -1', borderLeft: '3px solid var(--warning)' }}>
              <div className="card-header">
                <span className="card-title" style={{ color: 'var(--warning)' }}>⚠ Needs Attention</span>
                <span className="text-muted text-sm">{maintenance.length + pending.length + expiring.length} items</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
                {maintenance.length > 0 && (
                  <div style={{ background: 'var(--bg-elevated)', borderRadius: 6, padding: '12px 16px' }}>
                    <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--warning)', marginBottom: 8 }}>
                      🔧 Units in Maintenance ({maintenance.length})
                    </div>
                    {maintenance.map((u) => (
                      <div key={u.id} style={{ fontSize: 13, padding: '4px 0', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
                        <span>{u.name}</span>
                        <span className="text-muted text-sm">{u.city}</span>
                      </div>
                    ))}
                  </div>
                )}
                {pending.length > 0 && (
                  <div style={{ background: 'var(--bg-elevated)', borderRadius: 6, padding: '12px 16px' }}>
                    <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--accent-blue)', marginBottom: 8 }}>
                      ◎ Pending Approvals ({pending.length})
                    </div>
                    {pending.map((b) => (
                      <div key={b.id} style={{ fontSize: 13, padding: '6px 0', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.unit_name ?? `Unit ${b.unit_id}`}</div>
                          <div className="text-muted text-xs" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.campaign_name ?? '-'} - ${b.monthly_rate.toLocaleString()}/mo</div>
                        </div>
                        {canApprove && (
                          <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                            <button
                              className="btn btn-sm"
                              style={{ background: 'var(--success)', color: '#fff', fontSize: 10, padding: '3px 8px' }}
                              disabled={approvingId === b.id}
                              onClick={() => handleQuickApprove(b)}
                            >
                              {approvingId === b.id ? '...' : '✓'}
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              style={{ fontSize: 10, padding: '3px 8px' }}
                              disabled={approvingId === b.id}
                              onClick={() => handleQuickReject(b)}
                            >
                              ✕
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {expiring.length > 0 && (
                  <div style={{ background: 'var(--bg-elevated)', borderRadius: 6, padding: '12px 16px' }}>
                    <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--error)', marginBottom: 8 }}>
                      ◆ Expiring Within 30 Days ({expiring.length})
                    </div>
                    {expiring.map((c) => (
                      <div key={c.id} style={{ fontSize: 13, padding: '4px 0', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
                        <span>{c.name}</span>
                        <span className="text-muted text-sm">{c.end_date.slice(0, 10)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* Quick Actions + Rate Calculator */}
        <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Quick Actions */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Quick Actions</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { label: 'Book a Unit', icon: '◎', path: '/bookings', color: 'var(--accent)' },
                { label: 'New Campaign', icon: '◆', path: '/campaigns', color: 'var(--accent-blue)' },
                { label: 'View Analytics', icon: '◇', path: '/analytics', color: 'var(--success)' },
                { label: 'Weather Check', icon: '◈', path: '/weather', color: 'var(--warning)' },
                { label: 'Ops Queue', icon: '◉', path: '/ops-schedule', color: 'var(--error)' },
                { label: 'Reports', icon: '◇', path: '/reports', color: 'var(--text-muted)' },
              ].map((a) => (
                <button
                  key={a.path}
                  className="btn btn-secondary"
                  style={{ justifyContent: 'flex-start', gap: 10 }}
                  onClick={() => navigate(a.path)}
                >
                  <span style={{ color: a.color, fontSize: 16 }}>{a.icon}</span>
                  <span style={{ fontSize: 13 }}>{a.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Rate Calculator */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Rate Calculator</span>
              <span className="text-muted text-sm">Quick estimate</span>
            </div>
            <div className="form-group" style={{ marginBottom: 12 }}>
              <label className="form-label">Select Unit</label>
              <select
                className="select"
                value={rateUnit?.id ?? ''}
                onChange={(e) => setRateUnit(units.find((u) => u.id === parseInt(e.target.value)) ?? null)}
              >
                <option value="">Choose a unit...</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label">Booking Duration (weeks): {rateWeeks}</label>
              <input
                type="range" min={1} max={52} value={rateWeeks}
                onChange={(e) => setRateWeeks(parseInt(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--accent)' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)' }}>
                <span>1 wk</span><span>26 wk</span><span>52 wk</span>
              </div>
            </div>
            {rateUnit ? (
              <div style={{ background: 'var(--bg-elevated)', borderRadius: 6, padding: '14px 16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[
                    ['Monthly Rate', `$${rateUnit.monthly_rate.toLocaleString()}`],
                    ['Est. Total', `$${Math.round(rateUnit.monthly_rate * rateWeeks / 4.33).toLocaleString()}`],
                    ['Weekly Cost', `$${Math.round(rateUnit.monthly_rate / 4.33).toLocaleString()}`],
                    ['Wkly Impr.', rateUnit.weekly_impressions ? `${(rateUnit.weekly_impressions / 1000).toFixed(0)}k` : 'N/A'],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{k}</div>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--accent)' }}>{v}</div>
                    </div>
                  ))}
                </div>
                {rateUnit.weekly_impressions && (
                  <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: 8 }}>
                    CPM: <span style={{ color: 'var(--accent-blue)', fontFamily: 'var(--font-mono)' }}>
                      ${(rateUnit.monthly_rate / rateUnit.weekly_impressions * 1000).toFixed(2)}
                    </span> per 1,000 weekly impressions
                  </div>
                )}
              </div>
            ) : (
              <div className="empty-state" style={{ padding: '20px 0' }}>
                <div className="empty-state-text">Select a unit to calculate rates</div>
              </div>
            )}
          </div>
        </div>

        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <div className="card-header">
            <span className="card-title">Top Units by Monthly Revenue</span>
            <span className="text-muted text-sm">Sorted by rate</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Unit</th>
                  <th>Type</th>
                  <th>City</th>
                  <th>Rate/mo</th>
                  <th>Wkly Impr.</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {[...units].sort((a, b) => b.monthly_rate - a.monthly_rate).slice(0, 5).map((u, i) => (
                  <tr key={u.id}>
                    <td style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{i + 1}</td>
                    <td style={{ fontWeight: 500 }}>{u.name}</td>
                    <td><span className={`badge badge-${u.type}`}>{u.type}</span></td>
                    <td>{u.city}</td>
                    <td style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>${u.monthly_rate.toLocaleString()}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{u.weekly_impressions ? `${(u.weekly_impressions / 1000).toFixed(0)}k` : '-'}</td>
                    <td><span className={`badge badge-${u.status}`}>{u.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
