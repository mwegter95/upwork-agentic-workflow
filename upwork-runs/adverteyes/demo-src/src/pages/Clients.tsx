import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import Modal from '../components/Modal';
import { fetchClients, fetchCampaigns, fetchBookings, MOCK_BOOKINGS } from '../api';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import type { Client, Campaign, Booking } from '../api';

const INDUSTRIES = ['Automotive', 'Healthcare', 'CPG', 'Finance', 'Fitness', 'Retail', 'Entertainment', 'Tourism', 'Tech', 'Other'];

const CLIENT_ACTIVITIES: Record<string, { text: string; time: string }[]> = {
  default: [
    { text: 'Campaign started', time: '2 weeks ago' },
    { text: 'Booking confirmed', time: '1 month ago' },
    { text: 'Client onboarded', time: '3 months ago' },
  ],
};

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');
  const [selected, setSelected] = useState<Client | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [form, setForm] = useState({ name: '', contact: '', email: '', phone: '', industry: '' });
  const { toast } = useToast();
  const { user } = useAuth();
  const canEdit = user?.role === 'admin' || user?.role === 'sales';

  useEffect(() => {
    Promise.all([fetchClients(), fetchCampaigns(), fetchBookings()])
      .then(([cl, ca, bk]) => {
        setClients(cl);
        setCampaigns(ca);
        setBookings(bk.length ? bk : MOCK_BOOKINGS);
      })
      .finally(() => setLoading(false));
  }, []);

  const clientCampaigns = (cl: Client) =>
    campaigns.filter((c) => c.client_id === cl.id || c.client_name === cl.name);

  const clientBookings = (cl: Client) =>
    bookings.filter((b) => b.client_name === cl.name);

  const clientRevenue = (cl: Client) =>
    clientBookings(cl).filter((b) => b.status === 'confirmed').reduce((s, b) => s + b.monthly_rate, 0);

  const clientPipeline = (cl: Client) =>
    clientCampaigns(cl).reduce((s, c) => s + (c.budget ?? 0), 0);

  const filtered = clients.filter((cl) => {
    if (industryFilter && cl.industry !== industryFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return cl.name.toLowerCase().includes(q) || cl.contact.toLowerCase().includes(q) || cl.industry.toLowerCase().includes(q);
    }
    return true;
  });

  const totalRevenue = filtered.reduce((s, cl) => s + clientRevenue(cl), 0);
  const totalPipeline = filtered.reduce((s, cl) => s + clientPipeline(cl), 0);
  const activeCampaignCount = filtered.reduce(
    (s, cl) => s + clientCampaigns(cl).filter((c) => c.status === 'active').length, 0
  );

  const setF = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleCreate = async () => {
    if (!form.name) { toast('Client name is required', 'warn'); return; }
    setSaving(true);
    const newClient: Client = { id: Date.now(), ...form };
    setClients((p) => [...p, newClient]);
    setShowModal(false);
    setForm({ name: '', contact: '', email: '', phone: '', industry: '' });
    toast(`Client "${newClient.name}" added`, 'success');
    setSaving(false);
  };

  // Revenue-by-campaign chart data for selected client
  const selectedCampaignChart = selected
    ? clientCampaigns(selected).map((c) => ({
        name: c.name.length > 20 ? c.name.slice(0, 18) + '...' : c.name,
        budget: c.budget ?? 0,
        booked: c.booked_value ?? 0,
      }))
    : [];

  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>;

  return (
    <div style={{ display: 'flex', gap: 24 }}>
      {/* Main column */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, marginBottom: 4 }}>Clients</h1>
            <span className="text-muted">{filtered.length} of {clients.length} clients</span>
          </div>
          {canEdit && <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add Client</button>}
        </div>

        {/* KPI row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
          <div className="card" style={{ borderTop: '3px solid var(--accent)' }}>
            <div className="text-muted text-xs" style={{ textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>Total Clients</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--accent)' }}>{clients.length}</div>
          </div>
          <div className="card" style={{ borderTop: '3px solid var(--success)' }}>
            <div className="text-muted text-xs" style={{ textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>Active Campaigns</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--success)' }}>{activeCampaignCount}</div>
          </div>
          <div className="card" style={{ borderTop: '3px solid var(--accent-blue)' }}>
            <div className="text-muted text-xs" style={{ textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>Confirmed Revenue</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, color: 'var(--accent-blue)' }}>${totalRevenue.toLocaleString()}</div>
          </div>
          <div className="card" style={{ borderTop: '3px solid var(--warning)' }}>
            <div className="text-muted text-xs" style={{ textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>Budget Pipeline</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, color: 'var(--warning)' }}>${totalPipeline.toLocaleString()}</div>
          </div>
        </div>

        {/* Search + filter */}
        <div className="toolbar" style={{ marginBottom: 16 }}>
          <input
            className="input"
            placeholder="Search clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: 240 }}
          />
          <select className="select" value={industryFilter} onChange={(e) => setIndustryFilter(e.target.value)} style={{ maxWidth: 180 }}>
            <option value="">All Industries</option>
            {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
          </select>
          {(search || industryFilter) && (
            <button className="btn btn-ghost btn-sm" onClick={() => { setSearch(''); setIndustryFilter(''); }}>Clear</button>
          )}
          <span className="text-muted text-sm" style={{ marginLeft: 'auto' }}>{filtered.length} results</span>
        </div>

        {/* Revenue bar chart: all clients */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <span className="card-title">Revenue by Client</span>
            <span className="text-muted text-sm">Confirmed booking revenue</span>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart
              layout="vertical"
              data={[...filtered].map((cl) => ({ name: cl.name, revenue: clientRevenue(cl), pipeline: clientPipeline(cl) })).sort((a, b) => b.revenue - a.revenue)}
              margin={{ left: 0, right: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="name" width={140} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12, color: 'var(--text-primary)' }}
                formatter={(v: number, key: string) => [`$${v.toLocaleString()}`, key === 'revenue' ? 'Confirmed Revenue' : 'Budget Pipeline']}
              />
              <Bar dataKey="revenue" fill="var(--accent)" radius={[0, 3, 3, 0]} />
              <Bar dataKey="pipeline" fill="var(--accent-blue)" opacity={0.5} radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 11 }}>
            <span style={{ color: 'var(--accent)' }}>Confirmed Revenue</span>
            <span style={{ color: 'var(--accent-blue)', opacity: 0.8 }}>Budget Pipeline</span>
          </div>
        </div>

        {/* Clients table */}
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Contact</th>
                  <th>Email</th>
                  <th>Industry</th>
                  <th>Campaigns</th>
                  <th>Active</th>
                  <th>Revenue</th>
                  <th>Pipeline</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((cl) => {
                  const cams = clientCampaigns(cl);
                  const active = cams.filter((c) => c.status === 'active').length;
                  const rev = clientRevenue(cl);
                  const pipe = clientPipeline(cl);
                  const isSelected = selected?.id === cl.id;
                  return (
                    <tr
                      key={cl.id}
                      style={{ cursor: 'pointer' }}
                      className={isSelected ? 'tr-selected' : ''}
                      onClick={() => setSelected(isSelected ? null : cl)}
                    >
                      <td style={{ fontWeight: 600 }}>{cl.name}</td>
                      <td>{cl.contact}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>{cl.email}</td>
                      <td><span className="badge badge-upcoming">{cl.industry}</span></td>
                      <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)' }}>{cams.length}</td>
                      <td style={{ textAlign: 'center' }}>
                        {active > 0 ? <span style={{ color: 'var(--success)', fontFamily: 'var(--font-mono)' }}>{active}</span> : <span className="text-muted">0</span>}
                      </td>
                      <td style={{ color: rev > 0 ? 'var(--accent)' : 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {rev > 0 ? `$${rev.toLocaleString()}` : '-'}
                      </td>
                      <td style={{ color: pipe > 0 ? 'var(--accent-blue)' : 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {pipe > 0 ? `$${pipe.toLocaleString()}` : '-'}
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: 14 }}>{isSelected ? '✕' : '→'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="client-detail-panel">
          <div className="client-detail-header">
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, marginBottom: 4 }}>{selected.name}</h2>
              <span className="badge badge-upcoming">{selected.industry}</span>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => setSelected(null)}>✕</button>
          </div>

          <div className="client-detail-body">
            {/* Contact info */}
            <div className="client-detail-section">
              <div className="client-detail-section-title">Contact</div>
              <div style={{ display: 'grid', gap: 8 }}>
                {[
                  ['Name', selected.contact],
                  ['Email', selected.email],
                  ['Phone', selected.phone],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span className="text-muted">{k}</span>
                    <span style={{ fontFamily: k === 'Email' || k === 'Phone' ? 'var(--font-mono)' : undefined, fontSize: 12 }}>{v || '-'}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Revenue stats */}
            <div className="client-detail-section">
              <div className="client-detail-section-title">Revenue</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div style={{ background: 'var(--bg-elevated)', borderRadius: 6, padding: '12px 14px' }}>
                  <div className="text-muted text-xs" style={{ textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>Confirmed</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--accent)' }}>${clientRevenue(selected).toLocaleString()}</div>
                </div>
                <div style={{ background: 'var(--bg-elevated)', borderRadius: 6, padding: '12px 14px' }}>
                  <div className="text-muted text-xs" style={{ textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>Pipeline</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--accent-blue)' }}>${clientPipeline(selected).toLocaleString()}</div>
                </div>
              </div>
            </div>

            {/* Campaign budget/booked chart */}
            {selectedCampaignChart.length > 0 && (
              <div className="client-detail-section">
                <div className="client-detail-section-title">Campaign Utilization</div>
                <ResponsiveContainer width="100%" height={150}>
                  <BarChart data={selectedCampaignChart} barCategoryGap="30%" barGap={2}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 9 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 11, color: 'var(--text-primary)' }}
                      formatter={(v: number, k: string) => [`$${v.toLocaleString()}`, k === 'budget' ? 'Budget' : 'Booked']}
                    />
                    <Bar dataKey="budget" fill="var(--accent-blue)" opacity={0.5} radius={[2, 2, 0, 0]} />
                    <Bar dataKey="booked" fill="var(--accent)" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', gap: 12, marginTop: 6, fontSize: 10 }}>
                  <span style={{ color: 'var(--accent-blue)', opacity: 0.8 }}>Budget</span>
                  <span style={{ color: 'var(--accent)' }}>Booked</span>
                </div>
              </div>
            )}

            {/* Campaigns list */}
            <div className="client-detail-section">
              <div className="client-detail-section-title">Campaigns ({clientCampaigns(selected).length})</div>
              {clientCampaigns(selected).length === 0 ? (
                <div className="text-muted text-sm">No campaigns yet</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {clientCampaigns(selected).map((c) => {
                    const util = c.budget ? Math.round(((c.booked_value ?? 0) / c.budget) * 100) : 0;
                    return (
                      <div key={c.id} style={{ background: 'var(--bg-elevated)', borderRadius: 6, padding: '10px 14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <span style={{ fontSize: 13, fontWeight: 500 }}>{c.name}</span>
                          <span className={`badge badge-${c.status}`}>{c.status}</span>
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, fontFamily: 'var(--font-mono)' }}>
                          {c.start_date.slice(0, 10)} to {c.end_date.slice(0, 10)}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ flex: 1, height: 4, background: 'var(--border)', borderRadius: 2 }}>
                            <div style={{
                              width: `${Math.min(100, util)}%`, height: '100%', borderRadius: 2,
                              background: util > 70 ? 'var(--success)' : util > 40 ? 'var(--accent)' : 'var(--warning)',
                            }} />
                          </div>
                          <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', minWidth: 36 }}>{util}%</span>
                          <span style={{ fontSize: 11, color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>${(c.budget ?? 0).toLocaleString()}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Activity */}
            <div className="client-detail-section">
              <div className="client-detail-section-title">Recent Activity</div>
              {(CLIENT_ACTIVITIES[selected.name] ?? CLIENT_ACTIVITIES.default).map((a, i) => (
                <div key={i} className="activity-item">
                  <div className="activity-dot" />
                  <div>
                    <div className="activity-text">{a.text}</div>
                    <div className="activity-time">{a.time}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Notes */}
            <div className="client-detail-section">
              <div className="client-detail-section-title">Account Notes</div>
              <textarea
                className="textarea"
                placeholder="Add notes about this client (renewal timelines, key contacts, preferences)..."
                value={notes[selected.id] ?? ''}
                onChange={(e) => setNotes((p) => ({ ...p, [selected.id]: e.target.value }))}
                style={{ minHeight: 96 }}
              />
              {notes[selected.id] && (
                <button
                  className="btn btn-primary btn-sm"
                  style={{ marginTop: 8 }}
                  onClick={() => toast('Notes saved', 'success')}
                >
                  Save Notes
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <Modal
          title="Add Client"
          onClose={() => setShowModal(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreate} disabled={saving}>
                {saving ? 'Saving...' : 'Add Client'}
              </button>
            </>
          }
        >
          <div className="form-grid-2">
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Name *</label>
              <input className="input" value={form.name} onChange={(e) => setF('name', e.target.value)} placeholder="Acme Corp" />
            </div>
            <div className="form-group">
              <label className="form-label">Contact</label>
              <input className="input" value={form.contact} onChange={(e) => setF('contact', e.target.value)} placeholder="Jane Smith" />
            </div>
            <div className="form-group">
              <label className="form-label">Industry</label>
              <select className="select" value={form.industry} onChange={(e) => setF('industry', e.target.value)}>
                <option value="">Select industry</option>
                {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="input" type="email" value={form.email} onChange={(e) => setF('email', e.target.value)} placeholder="jane@acme.com" />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="input" value={form.phone} onChange={(e) => setF('phone', e.target.value)} placeholder="813-555-0100" />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
