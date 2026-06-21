import React, { useEffect, useState, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { fetchCampaigns, createCampaign, updateCampaign, fetchBookings } from '../api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import type { Campaign, Booking } from '../api';
import type { Column } from '../components/DataTable';

const COLS: Column<Campaign>[] = [
  { key: 'name', header: 'Campaign' },
  { key: 'client_name', header: 'Client', render: (r) => r.client_name ?? '-' },
  { key: 'status', header: 'Status', render: (r) => <span className={`badge badge-${r.status}`}>{r.status}</span> },
  { key: 'start_date', header: 'Start', render: (r) => r.start_date.slice(0, 10) },
  { key: 'end_date', header: 'End', render: (r) => r.end_date.slice(0, 10) },
  {
    key: 'booking_count', header: 'Bookings',
    render: (r) => String(r.booking_count ?? 0),
    getValue: (r) => r.booking_count ?? 0,
  },
  {
    key: 'booked_value', header: 'Booked Value',
    render: (r) => r.booked_value ? `$${r.booked_value.toLocaleString()}` : '-',
    getValue: (r) => r.booked_value ?? 0,
  },
  {
    key: 'budget', header: 'Budget',
    render: (r) => r.budget ? `$${r.budget.toLocaleString()}` : '-',
    getValue: (r) => r.budget ?? 0,
  },
];

const CAMP_TL_START = new Date('2026-01-01');
const CAMP_TL_END   = new Date('2027-01-01');
const CAMP_MONTHS   = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const CAMP_COLORS: Record<string, string> = {
  active: '#22C55E', upcoming: '#3B82F6', completed: '#8A9AC0', cancelled: '#EF4444',
};

function campaignGanttSpan(c: Campaign) {
  const total = CAMP_TL_END.getTime() - CAMP_TL_START.getTime();
  const left  = Math.max(0, (new Date(c.start_date).getTime() - CAMP_TL_START.getTime()) / total * 100);
  const right = Math.min(100, (new Date(c.end_date).getTime() - CAMP_TL_START.getTime()) / total * 100);
  return { left: `${left}%`, width: `${Math.max(right - left, 1)}%` };
}

export default function Campaigns() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [view, setView] = useState<'table' | 'gantt'>('table');
  const [selected, setSelected] = useState<Campaign | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editCampaign, setEditCampaign] = useState<Partial<Campaign>>({});
  const [saving, setSaving] = useState(false);

  const canEdit = user?.role === 'admin' || user?.role === 'sales';
  const { toast } = useToast();

  const load = useCallback(() => {
    setLoading(true);
    fetchCampaigns().then(setCampaigns).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!selected) { setBookings([]); return; }
    fetchBookings({ campaign_id: selected.id }).then(setBookings);
  }, [selected]);

  const filtered = campaigns.filter((c) => {
    if (statusFilter && c.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!c.name.toLowerCase().includes(q) && !(c.client_name ?? '').toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const openNew = () => { setEditCampaign({ status: 'upcoming', start_date: '', end_date: '' }); setShowModal(true); };
  const openEdit = (c: Campaign) => { setEditCampaign({ ...c }); setShowModal(true); };

  const handleSave = async () => {
    if (!editCampaign.name || !editCampaign.start_date || !editCampaign.end_date) {
      toast('Name, start date, and end date are required', 'warn'); return;
    }
    setSaving(true);
    try {
      if (editCampaign.id) await updateCampaign(editCampaign.id, editCampaign);
      else await createCampaign({ ...editCampaign, client_id: 1 });
      setShowModal(false);
      setEditCampaign({});
      load();
      toast(editCampaign.id ? 'Campaign updated' : 'Campaign created', 'success');
    } catch { toast('Save failed . API may be offline', 'error'); }
    finally { setSaving(false); }
  };

  const set = <K extends keyof Campaign>(k: K, v: Campaign[K]) =>
    setEditCampaign((p) => ({ ...p, [k]: v }));

  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28 }}>Campaigns</h1>
          <span className="text-muted">{campaigns.length} campaigns. Click a row to expand bookings.</span>
        </div>
        {canEdit && (
          <button className="btn btn-primary" onClick={openNew}>+ New Campaign</button>
        )}
      </div>

      <div className="toolbar">
        <input
          className="input"
          placeholder="Search campaign or client..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 240 }}
        />
        <select className="select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ maxWidth: 160 }}>
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="upcoming">Upcoming</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <div style={{ marginLeft: 'auto' }}>
          <div className="view-toggle">
            <button className={`view-btn${view === 'table' ? ' active' : ''}`} onClick={() => setView('table')}>Table</button>
            <button className={`view-btn${view === 'gantt' ? ' active' : ''}`} onClick={() => setView('gantt')}>Gantt</button>
          </div>
        </div>
      </div>

      {view === 'gantt' ? (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <span className="card-title">Campaign Timeline 2026</span>
            <div style={{ display: 'flex', gap: 12, fontSize: 11 }}>
              {Object.entries(CAMP_COLORS).map(([s, c]) => (
                <span key={s} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: c }} />
                  {s}
                </span>
              ))}
            </div>
          </div>
          <div className="timeline-wrap">
            <div className="timeline-header">
              <div style={{ width: 180 }} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', flex: 1 }}>
                {CAMP_MONTHS.map((m) => (
                  <div key={m} style={{ textAlign: 'center', fontSize: 10, color: 'var(--text-muted)', padding: '4px 0' }}>{m}</div>
                ))}
              </div>
            </div>
            {filtered.map((c) => {
              const { left, width } = campaignGanttSpan(c);
              const utilPct = c.budget ? Math.round(((c.booked_value ?? 0) / c.budget) * 100) : 0;
              return (
                <div key={c.id} className="timeline-row" style={{ gridTemplateColumns: '180px 1fr', minHeight: 44 }}>
                  <div style={{ fontSize: 12, padding: '0 10px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <span style={{ fontWeight: 500 }}>{c.name}</span>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{c.client_name ?? ''}</span>
                  </div>
                  <div style={{ position: 'relative', height: 36, display: 'flex', alignItems: 'center' }}>
                    <div
                      style={{
                        position: 'absolute',
                        left,
                        width,
                        height: 26,
                        background: CAMP_COLORS[c.status] ?? '#888',
                        borderRadius: 4,
                        opacity: c.status === 'completed' ? 0.5 : 0.85,
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0 8px',
                        fontSize: 10,
                        color: '#fff',
                        fontWeight: 600,
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        cursor: 'pointer',
                      }}
                      title={`${c.name}: ${c.start_date.slice(0,10)} to ${c.end_date.slice(0,10)}${c.budget ? `. $${c.budget.toLocaleString()} budget, ${utilPct}% utilized` : ''}`}
                      onClick={() => setSelected((prev) => (prev?.id === c.id ? null : c))}
                    >
                      {c.name}
                      {c.budget && <span style={{ marginLeft: 6, fontWeight: 400, opacity: 0.8 }}>{utilPct}%</span>}
                    </div>
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div className="empty-state"><div className="empty-state-icon">◎</div><div className="empty-state-text">No campaigns match filters</div></div>
            )}
          </div>
          {/* Selected campaign detail below Gantt */}
          {selected && (
            <div style={{ marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div>
                  <span className="card-title" style={{ fontSize: 15 }}>{selected.name}</span>
                  <span className={`badge badge-${selected.status}`} style={{ marginLeft: 8 }}>{selected.status}</span>
                  <span className="text-muted text-sm" style={{ marginLeft: 8 }}>{selected.start_date.slice(0,10)} to {selected.end_date.slice(0,10)}</span>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => setSelected(null)}>Close ✕</button>
              </div>
              {selected.budget != null && (
                <div style={{ marginBottom: 10 }}>
                  <div className="budget-bar-label">
                    <span>Budget utilization</span>
                    <span>${(selected.booked_value ?? 0).toLocaleString()} / ${selected.budget.toLocaleString()}</span>
                  </div>
                  <div className="budget-progress-wrap">
                    <div className="budget-progress-fill" style={{
                      width: `${Math.min(100, Math.round(((selected.booked_value ?? 0) / selected.budget) * 100))}%`,
                      background: ((selected.booked_value ?? 0) / selected.budget) > 0.8 ? 'var(--success)' : 'var(--accent)',
                    }} />
                  </div>
                </div>
              )}
              {bookings.length > 0 && (
                <div className="table-wrap">
                  <table>
                    <thead><tr><th>Unit</th><th>City</th><th>Start</th><th>End</th><th>Rate/mo</th><th>Status</th></tr></thead>
                    <tbody>
                      {bookings.map((b) => (
                        <tr key={b.id}>
                          <td>{b.unit_name ?? '-'}</td>
                          <td>{b.city ?? '-'}</td>
                          <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{b.start_date.slice(0,10)}</td>
                          <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{b.end_date.slice(0,10)}</td>
                          <td style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>${b.monthly_rate.toLocaleString()}</td>
                          <td><span className={`badge badge-${b.status}`}>{b.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
      <div className="card" style={{ marginBottom: 20 }}>
        <DataTable
          data={filtered}
          columns={[
            ...COLS,
            ...(canEdit
              ? [{
                  key: 'actions',
                  header: '',
                  sortable: false,
                  render: (r: Campaign) => (
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={(e) => { e.stopPropagation(); openEdit(r); }}
                    >
                      Edit
                    </button>
                  ),
                }]
              : []),
          ]}
          rowKey={(r) => r.id}
          onRowClick={(r) => setSelected((prev) => (prev?.id === r.id ? null : r))}
          selectedId={selected?.id}
        />
      </div>
      )}

      {view !== 'gantt' && selected && (
        <div className="card">
          <div className="card-header">
            <div>
              <span className="card-title">{selected.name}</span>
              <div style={{ marginTop: 4, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <span className={`badge badge-${selected.status}`}>{selected.status}</span>
                <span className="text-muted text-sm">{selected.start_date.slice(0, 10)} to {selected.end_date.slice(0, 10)}</span>
                {selected.budget && (
                  <span className="text-muted text-sm">Budget: ${selected.budget.toLocaleString()}</span>
                )}
                {selected.booked_value != null && selected.budget && (
                  <span className="text-muted text-sm">Booked: ${selected.booked_value.toLocaleString()}</span>
                )}
              </div>
              {selected.budget != null && (
                <div style={{ marginTop: 10 }}>
                  <div className="budget-bar-label">
                    <span>Budget utilization</span>
                    <span>
                      {Math.min(100, Math.round(((selected.booked_value ?? 0) / selected.budget) * 100))}%
                      {' / '}
                      ${(selected.booked_value ?? 0).toLocaleString()} of ${selected.budget.toLocaleString()}
                    </span>
                  </div>
                  <div className="budget-progress-wrap">
                    <div
                      className="budget-progress-fill"
                      style={{
                        width: `${Math.min(100, Math.round(((selected.booked_value ?? 0) / selected.budget) * 100))}%`,
                        background: ((selected.booked_value ?? 0) / selected.budget) > 0.8
                          ? 'var(--success)'
                          : ((selected.booked_value ?? 0) / selected.budget) > 0.4
                          ? 'var(--accent)'
                          : 'var(--warning)',
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => setSelected(null)}>Close ✕</button>
          </div>

          {bookings.length > 0 && (
            <>
              {/* Revenue by unit mini-chart */}
              <div style={{ marginBottom: 16 }}>
                <div className="text-muted" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>Revenue by Unit (monthly rate)</div>
                <ResponsiveContainer width="100%" height={120}>
                  <BarChart
                    data={bookings.map((b) => ({
                      name: b.unit_name ? b.unit_name.replace(/^(I-\d+|SR-\d+|Dale|Westshore|Channelside|Amalie|Tampa|City|Route)\s?/, (m) => m) : '-',
                      rate: b.monthly_rate,
                    }))}
                    barCategoryGap="35%"
                    margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 9 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} width={36} />
                    <Tooltip
                      contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 11, color: 'var(--text-primary)' }}
                      formatter={(v: number) => [`$${v.toLocaleString()}/mo`, 'Rate']}
                    />
                    <Bar dataKey="rate" fill="var(--accent)" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Unit</th><th>Type</th><th>City</th><th>Start</th><th>End</th><th>Rate/mo</th><th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((b) => (
                      <tr key={b.id}>
                        <td>{b.unit_name ?? '-'}</td>
                        <td>{b.unit_type ? <span className={`badge badge-${b.unit_type}`}>{b.unit_type}</span> : '-'}</td>
                        <td>{b.city ?? '-'}</td>
                        <td>{b.start_date.slice(0, 10)}</td>
                        <td>{b.end_date.slice(0, 10)}</td>
                        <td>${b.monthly_rate.toLocaleString()}</td>
                        <td><span className={`badge badge-${b.status}`}>{b.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
          {bookings.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon">◎</div>
              <div className="empty-state-text">No bookings for this campaign</div>
            </div>
          )}
        </div>
      )}

      {showModal && (
        <Modal
          title={editCampaign.id ? 'Edit Campaign' : 'New Campaign'}
          onClose={() => { setShowModal(false); setEditCampaign({}); }}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => { setShowModal(false); setEditCampaign({}); }}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Campaign'}
              </button>
            </>
          }
        >
          <div className="form-grid-2">
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Campaign Name *</label>
              <input className="input" value={editCampaign.name ?? ''} onChange={(e) => set('name', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="select" value={editCampaign.status ?? 'upcoming'} onChange={(e) => set('status', e.target.value as Campaign['status'])}>
                <option value="active">Active</option>
                <option value="upcoming">Upcoming</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Budget ($)</label>
              <input className="input" type="number" value={editCampaign.budget ?? ''} onChange={(e) => set('budget', parseFloat(e.target.value))} />
            </div>
            <div className="form-group">
              <label className="form-label">Start Date *</label>
              <input className="input" type="date" value={editCampaign.start_date ?? ''} onChange={(e) => set('start_date', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">End Date *</label>
              <input className="input" type="date" value={editCampaign.end_date ?? ''} onChange={(e) => set('end_date', e.target.value)} />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Notes</label>
              <textarea className="textarea" value={editCampaign.notes ?? ''} onChange={(e) => set('notes', e.target.value)} />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
