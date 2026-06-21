import React, { useEffect, useState, useCallback, useMemo } from 'react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import {
  fetchBookings, fetchInventory, fetchCampaigns,
  checkConflict, createBooking, cancelBooking, approveBooking, rejectBooking,
} from '../api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import type { Booking, Unit, Campaign } from '../api';
import type { Column } from '../components/DataTable';

const COLS: Column<Booking>[] = [
  { key: 'unit_name', header: 'Unit', render: (r) => r.unit_name ?? '-' },
  {
    key: 'unit_type', header: 'Type',
    render: (r) => r.unit_type ? <span className={`badge badge-${r.unit_type}`}>{r.unit_type}</span> : '-',
    sortable: false,
  },
  { key: 'campaign_name', header: 'Campaign', render: (r) => r.campaign_name ?? '-' },
  { key: 'client_name', header: 'Client', render: (r) => r.client_name ?? '-' },
  { key: 'city', header: 'City', render: (r) => r.city ?? '-' },
  { key: 'start_date', header: 'Start', render: (r) => r.start_date.slice(0, 10) },
  { key: 'end_date', header: 'End', render: (r) => r.end_date.slice(0, 10) },
  {
    key: 'monthly_rate', header: 'Rate/mo',
    render: (r) => `$${r.monthly_rate.toLocaleString()}`,
    getValue: (r) => r.monthly_rate,
  },
  { key: 'status', header: 'Status', render: (r) => <span className={`badge badge-${r.status}`}>{r.status}</span> },
];

interface BookingForm {
  unit_id: string;
  campaign_id: string;
  start_date: string;
  end_date: string;
  status: string;
  monthly_rate: string;
}

const DEFAULT_FORM: BookingForm = {
  unit_id: '3',
  campaign_id: '1',
  start_date: '',
  end_date: '',
  status: 'confirmed',
  monthly_rate: '',
};

const TIMELINE_START = new Date('2026-06-01');
const TIMELINE_END   = new Date('2026-12-31');
const MONTHS = ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const TODAY_PCT = Math.min(100, Math.max(0,
  (new Date().getTime() - TIMELINE_START.getTime()) /
  (TIMELINE_END.getTime() - TIMELINE_START.getTime()) * 100
));
const CAMPAIGN_COLORS = ['#FF6B1A', '#3B82F6', '#22C55E', '#EAB308', '#A78BFA', '#EC4899', '#14B8A6'];
const campaignColor = (id: number) => CAMPAIGN_COLORS[id % CAMPAIGN_COLORS.length];

function bookingToSpan(b: Booking) {
  const total = TIMELINE_END.getTime() - TIMELINE_START.getTime();
  const left  = Math.max(0, (new Date(b.start_date).getTime() - TIMELINE_START.getTime()) / total * 100);
  const right = Math.min(100, (new Date(b.end_date).getTime() - TIMELINE_START.getTime()) / total * 100);
  return { left: `${left}%`, width: `${Math.max(right - left, 2)}%` };
}

export default function Bookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [view, setView] = useState<'table' | 'timeline' | 'calendar'>('table');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<BookingForm>(DEFAULT_FORM);
  const [conflict, setConflict] = useState<{ checked: boolean; conflict: boolean; detail: string | null }>({
    checked: false, conflict: false, detail: null,
  });
  const [checking, setChecking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [approving, setApproving] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkApproving, setBulkApproving] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const canApprove = user?.role === 'admin' || user?.role === 'sales';
  // Calendar state
  const [calMonth, setCalMonth] = useState<{ year: number; month: number }>(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [calSelected, setCalSelected] = useState<number | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([fetchBookings(), fetchInventory(), fetchCampaigns()])
      .then(([b, u, c]) => { setBookings(b); setUnits(u); setCampaigns(c); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  // Auto-fill rate from selected unit
  useEffect(() => {
    if (form.unit_id && units.length) {
      const unit = units.find((u) => u.id === parseInt(form.unit_id));
      if (unit) setForm((p) => ({ ...p, monthly_rate: String(unit.monthly_rate) }));
    }
  }, [form.unit_id, units]);

  const filtered = bookings.filter((b) => {
    if (statusFilter && b.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !b.unit_name?.toLowerCase().includes(q) &&
        !b.campaign_name?.toLowerCase().includes(q) &&
        !b.client_name?.toLowerCase().includes(q)
      ) return false;
    }
    return true;
  });

  const resetConflict = () => setConflict({ checked: false, conflict: false, detail: null });

  const setF = <K extends keyof BookingForm>(k: K, v: string) => {
    setForm((p) => ({ ...p, [k]: v }));
    if (k === 'unit_id' || k === 'start_date' || k === 'end_date') resetConflict();
  };

  const handleCheckConflict = async () => {
    if (!form.unit_id || !form.start_date || !form.end_date) return;
    setChecking(true);
    const result = await checkConflict(parseInt(form.unit_id), form.start_date, form.end_date);
    setConflict({ checked: true, ...result });
    setChecking(false);
  };

  const handleCreate = async () => {
    if (!form.start_date || !form.end_date || !form.monthly_rate) {
      toast('Fill all required fields', 'warn'); return;
    }
    setSaving(true);
    try {
      await createBooking({
        unit_id: parseInt(form.unit_id),
        campaign_id: parseInt(form.campaign_id),
        start_date: form.start_date,
        end_date: form.end_date,
        status: form.status as Booking['status'],
        monthly_rate: parseFloat(form.monthly_rate),
      });
      setShowModal(false);
      resetConflict();
      load();
    } catch (e: any) {
      if (e?.response?.status === 409) {
        setConflict({ checked: true, conflict: true, detail: e.response.data?.detail ?? 'Booking conflict detected.' });
      } else {
        toast('Create failed . API may be offline', 'error');
      }
    } finally { setSaving(false); }
  };

  const handleCancel = async (b: Booking, e: React.MouseEvent) => {
    e.stopPropagation();
    if (b.status === 'cancelled') return;
    if (!confirm(`Cancel booking for "${b.unit_name ?? 'this unit'}"?`)) return;
    try { await cancelBooking(b.id); load(); toast('Booking cancelled', 'info'); } catch { toast('Cancel failed', 'error'); }
  };

  const handleApprove = async (b: Booking, e: React.MouseEvent) => {
    e.stopPropagation();
    setApproving(b.id);
    try {
      await approveBooking(b.id);
      setBookings((prev) => prev.map((x) => x.id === b.id ? { ...x, status: 'confirmed' } : x));
      toast(`Booking approved: ${b.unit_name ?? 'unit'}`, 'success');
    } catch { toast('Approval failed . API may be offline', 'error'); }
    finally { setApproving(null); }
  };

  const toggleSelect = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleBulkApprove = async () => {
    const pending = filtered.filter((b) => b.status === 'pending' && selectedIds.has(b.id));
    if (pending.length === 0) return;
    setBulkApproving(true);
    try {
      await Promise.all(pending.map((b) => approveBooking(b.id)));
      setBookings((prev) => prev.map((b) => pending.some((p) => p.id === b.id) ? { ...b, status: 'confirmed' } : b));
      toast(`Approved ${pending.length} booking${pending.length !== 1 ? 's' : ''}`, 'success');
      setSelectedIds(new Set());
    } catch { toast('Bulk approve failed', 'error'); }
    finally { setBulkApproving(false); }
  };

  const handleBulkReject = async () => {
    const pending = filtered.filter((b) => b.status === 'pending' && selectedIds.has(b.id));
    if (pending.length === 0 || !confirm(`Reject ${pending.length} booking${pending.length !== 1 ? 's' : ''}?`)) return;
    setBulkApproving(true);
    try {
      await Promise.all(pending.map((b) => rejectBooking(b.id)));
      setBookings((prev) => prev.map((b) => pending.some((p) => p.id === b.id) ? { ...b, status: 'cancelled' } : b));
      toast(`Rejected ${pending.length} bookings`, 'warn');
      setSelectedIds(new Set());
    } catch { toast('Bulk reject failed', 'error'); }
    finally { setBulkApproving(false); }
  };

  const handleReject = async (b: Booking, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Reject booking for "${b.unit_name ?? 'this unit'}"?`)) return;
    setApproving(b.id);
    try {
      await rejectBooking(b.id);
      setBookings((prev) => prev.map((x) => x.id === b.id ? { ...x, status: 'cancelled' } : x));
      toast('Booking rejected', 'warn');
    } catch { toast('Reject failed . API may be offline', 'error'); }
    finally { setApproving(null); }
  };

  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>;

  const activeUnits = units.filter((u) => u.status !== 'maintenance');
  const activeCampaigns = campaigns.filter((c) => c.status !== 'cancelled' && c.status !== 'completed');

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28 }}>Bookings</h1>
          <span className="text-muted">{bookings.length} total bookings</span>
        </div>
        <button className="btn btn-primary" onClick={() => { setForm({ ...DEFAULT_FORM }); resetConflict(); setShowModal(true); }}>
          + New Booking
        </button>
      </div>

      {/* Pending approvals banner */}
      {canApprove && bookings.filter((b) => b.status === 'pending').length > 0 && (
        <div style={{ background: 'rgba(234,179,8,0.12)', border: '1px solid var(--warning)', borderRadius: 'var(--radius)', padding: '10px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: 'var(--warning)', fontWeight: 600 }}>⚠</span>
          <span style={{ fontSize: 13 }}>
            <strong>{bookings.filter((b) => b.status === 'pending').length} pending booking{bookings.filter((b) => b.status === 'pending').length !== 1 ? 's' : ''}</strong> need approval. Use Approve / Reject in the Actions column below.
          </span>
          <button className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto' }} onClick={() => setStatusFilter('pending')}>View pending</button>
        </div>
      )}

      <div className="toolbar">
        <input
          className="input"
          placeholder="Search unit, campaign, client..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 260 }}
        />
        <select className="select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ maxWidth: 160 }}>
          <option value="">All Statuses</option>
          <option value="confirmed">Confirmed</option>
          <option value="pending">Pending</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <div style={{ marginLeft: 'auto' }}>
          <div className="view-toggle">
            <button className={`view-btn${view === 'table' ? ' active' : ''}`} onClick={() => setView('table')}>Table</button>
            <button className={`view-btn${view === 'timeline' ? ' active' : ''}`} onClick={() => setView('timeline')}>Timeline</button>
            <button className={`view-btn${view === 'calendar' ? ' active' : ''}`} onClick={() => setView('calendar')}>Calendar</button>
          </div>
        </div>
      </div>

      {view === 'calendar' ? (() => {
        const { year, month } = calMonth;
        const firstDow = new Date(year, month, 1).getDay(); // 0=Sun
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const monthName = new Date(year, month, 1).toLocaleString('default', { month: 'long', year: 'numeric' });
        const today = new Date();
        const todayIsThisMonth = today.getFullYear() === year && today.getMonth() === month;
        const todayDay = today.getDate();
        const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const CAMPAIGN_COLORS_CAL = ['#FF6B1A', '#3B82F6', '#22C55E', '#EAB308', '#A78BFA', '#EC4899', '#14B8A6'];
        const campColor = (id: number) => CAMPAIGN_COLORS_CAL[id % CAMPAIGN_COLORS_CAL.length];

        const bookingsForDay = (day: number): Booking[] => {
          const date = new Date(year, month, day);
          return filtered.filter((b) => {
            const start = new Date(b.start_date);
            const end = new Date(b.end_date);
            // compare date only (midnight)
            return date >= new Date(start.getFullYear(), start.getMonth(), start.getDate()) &&
                   date <= new Date(end.getFullYear(), end.getMonth(), end.getDate());
          });
        };

        const selectedBookings = calSelected !== null ? bookingsForDay(calSelected) : [];

        const prevMonth = () => {
          setCalSelected(null);
          setCalMonth(({ year: y, month: m }) => m === 0 ? { year: y - 1, month: 11 } : { year: y, month: m - 1 });
        };
        const nextMonth = () => {
          setCalSelected(null);
          setCalMonth(({ year: y, month: m }) => m === 11 ? { year: y + 1, month: 0 } : { year: y, month: m + 1 });
        };

        return (
          <div className="card">
            <div className="cal-nav">
              <button className="btn btn-ghost btn-sm" onClick={prevMonth}>← Prev</button>
              <span className="cal-title">{monthName}</span>
              <button className="btn btn-ghost btn-sm" onClick={nextMonth}>Next →</button>
            </div>
            <div className="cal-grid">
              {DOW.map((d) => <div key={d} className="cal-dow">{d}</div>)}
              {/* Empty cells for offset */}
              {Array.from({ length: firstDow }).map((_, i) => (
                <div key={`empty-${i}`} className="cal-day empty" />
              ))}
              {/* Day cells */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dayBookings = bookingsForDay(day);
                const isToday = todayIsThisMonth && day === todayDay;
                const isSelected = calSelected === day;
                return (
                  <div
                    key={day}
                    className={`cal-day${isToday ? ' today' : ''}${isSelected ? ' selected' : ''}`}
                    onClick={() => setCalSelected(isSelected ? null : day)}
                  >
                    <div className="cal-day-num">{day}</div>
                    <div className="cal-dots">
                      {dayBookings.slice(0, 6).map((b) => (
                        <div
                          key={b.id}
                          className="cal-dot"
                          style={{ background: campColor(b.campaign_id) }}
                          title={`${b.unit_name}: ${b.campaign_name}`}
                        />
                      ))}
                      {dayBookings.length > 6 && (
                        <span style={{ fontSize: 9, color: 'var(--text-muted)', lineHeight: 1 }}>+{dayBookings.length - 6}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Selected day detail */}
            {calSelected !== null && (
              <div className="cal-booking-list">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span className="card-title" style={{ fontSize: 15 }}>
                    {new Date(year, month, calSelected).toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric' })}
                  </span>
                  <span className="text-muted text-sm">{selectedBookings.length} active booking{selectedBookings.length !== 1 ? 's' : ''}</span>
                </div>
                {selectedBookings.length === 0 ? (
                  <div className="empty-state" style={{ padding: '20px 0' }}>
                    <div className="empty-state-icon">◎</div>
                    <div className="empty-state-text">No bookings on this day</div>
                  </div>
                ) : selectedBookings.map((b) => (
                  <div key={b.id} className="cal-booking-item">
                    <div className="cal-booking-dot" style={{ background: campColor(b.campaign_id) }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 500, fontSize: 13 }}>{b.unit_name ?? '-'}</div>
                      <div className="text-muted text-sm">{b.campaign_name ?? '-'} / {b.client_name ?? '-'}</div>
                      <div className="text-muted text-sm">
                        {b.start_date.slice(0, 10)} to {b.end_date.slice(0, 10)}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                      <span style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600 }}>
                        ${b.monthly_rate.toLocaleString()}/mo
                      </span>
                      <span className={`badge badge-${b.status}`}>{b.status}</span>
                      {b.unit_type && <span className={`badge badge-${b.unit_type}`}>{b.unit_type}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Legend */}
            <div style={{ marginTop: 16, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {Array.from(new Set(filtered.map((b) => b.campaign_id))).slice(0, 6).map((cid) => {
                const camp = filtered.find((b) => b.campaign_id === cid);
                return camp ? (
                  <div key={cid} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: campColor(cid) }} />
                    <span className="text-muted text-sm">{camp.campaign_name ?? `Campaign ${cid}`}</span>
                  </div>
                ) : null;
              })}
            </div>
          </div>
        );
      })() : view === 'timeline' ? (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Booking Timeline: Jun to Dec 2026</span>
            <span className="text-muted text-sm">{filtered.length} bookings</span>
          </div>
          <div className="timeline-wrap">
            <div className="timeline-header">
              <div style={{ width: 160 }} />
              <div className="timeline-months" style={{ position: 'relative' }}>
                {MONTHS.map((m) => <div key={m} className="timeline-month-label">{m}</div>)}
                {TODAY_PCT > 0 && TODAY_PCT < 100 && (
                  <div style={{
                    position: 'absolute', top: 0, bottom: 0,
                    left: `${TODAY_PCT}%`, width: 1,
                    background: 'var(--accent)', opacity: 0.7,
                    display: 'flex', alignItems: 'flex-start',
                  }}>
                    <span style={{ position: 'absolute', top: 2, left: 4, fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--accent)', fontWeight: 700, whiteSpace: 'nowrap' }}>TODAY</span>
                  </div>
                )}
              </div>
            </div>
            {Array.from(new Set(filtered.map((b) => b.unit_name ?? `Unit ${b.unit_id}`))).map((unitName) => {
              const unitBookings = filtered.filter((b) => (b.unit_name ?? `Unit ${b.unit_id}`) === unitName);
              return (
                <div key={unitName} className="timeline-row">
                  <div className="timeline-unit-label" title={unitName}>{unitName}</div>
                  <div className="timeline-bars">
                    {TODAY_PCT > 0 && TODAY_PCT < 100 && (
                      <div className="timeline-today" style={{ left: `${TODAY_PCT}%` }} />
                    )}
                    {unitBookings.map((b) => {
                      const { left, width } = bookingToSpan(b);
                      return (
                        <div
                          key={b.id}
                          className="timeline-bar"
                          style={{ left, width, background: campaignColor(b.campaign_id) }}
                          title={`${b.campaign_name} • ${b.start_date} to ${b.end_date} • $${b.monthly_rate.toLocaleString()}/mo`}
                        >
                          {b.campaign_name}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          {filtered.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon">◎</div>
              <div className="empty-state-text">No bookings match current filters</div>
            </div>
          )}
        </div>
      ) : (() => {
        const pendingSelected = filtered.filter((b) => b.status === 'pending' && selectedIds.has(b.id));
        const checkCol = canApprove ? [{
          key: 'select',
          header: '',
          sortable: false,
          render: (r: Booking) => r.status === 'pending' ? (
            <input
              type="checkbox"
              checked={selectedIds.has(r.id)}
              onChange={() => {}}
              onClick={(e) => toggleSelect(r.id, e)}
              style={{ accentColor: 'var(--accent)', cursor: 'pointer', width: 14, height: 14 }}
            />
          ) : <span style={{ display: 'inline-block', width: 14 }} />,
        }] : [];
        return (
      <div className="card">
        {canApprove && pendingSelected.length > 0 && (
          <div style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid var(--accent-blue)', borderRadius: 'var(--radius)', padding: '8px 14px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, color: 'var(--accent-blue)', fontWeight: 600 }}>
              {pendingSelected.length} pending booking{pendingSelected.length !== 1 ? 's' : ''} selected
            </span>
            <button
              className="btn btn-sm"
              style={{ background: 'var(--success)', color: '#fff' }}
              disabled={bulkApproving}
              onClick={handleBulkApprove}
            >
              {bulkApproving ? '...' : `✓ Approve ${pendingSelected.length}`}
            </button>
            <button className="btn btn-danger btn-sm" disabled={bulkApproving} onClick={handleBulkReject}>
              ✕ Reject {pendingSelected.length}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => setSelectedIds(new Set())}>Clear</button>
          </div>
        )}
        <DataTable
          data={filtered}
          columns={[
            ...checkCol,
            ...COLS,
            {
              key: 'actions',
              header: 'Actions',
              sortable: false,
              render: (r) => (
                <div style={{ display: 'flex', gap: 6 }}>
                  {r.status === 'pending' && canApprove && (
                    <>
                      <button
                        className="btn btn-sm"
                        style={{ background: 'var(--success)', color: '#fff', fontSize: 11 }}
                        disabled={approving === r.id}
                        onClick={(e) => handleApprove(r, e)}
                      >
                        {approving === r.id ? '...' : '✓ Approve'}
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        style={{ fontSize: 11 }}
                        disabled={approving === r.id}
                        onClick={(e) => handleReject(r, e)}
                      >
                        ✕ Reject
                      </button>
                    </>
                  )}
                  {r.status !== 'pending' && (
                    <button
                      className="btn btn-danger btn-sm"
                      disabled={r.status === 'cancelled'}
                      onClick={(e) => handleCancel(r, e)}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              ),
            },
          ]}
          rowKey={(r) => r.id}
        />
      </div>
        );
      })()}

      {showModal && (
        <Modal
          title="New Booking"
          onClose={() => { setShowModal(false); resetConflict(); }}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button
                className="btn btn-primary"
                onClick={handleCreate}
                disabled={saving || (conflict.checked && conflict.conflict)}
              >
                {saving ? 'Creating...' : 'Create Booking'}
              </button>
            </>
          }
        >
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Ad Unit</label>
              <select className="select" value={form.unit_id} onChange={(e) => setF('unit_id', e.target.value)}>
                {activeUnits.map((u) => (
                  <option key={u.id} value={u.id}>{u.name} ({u.status})</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Campaign</label>
              <select className="select" value={form.campaign_id} onChange={(e) => setF('campaign_id', e.target.value)}>
                {activeCampaigns.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Start Date</label>
              <input className="input" type="date" value={form.start_date} onChange={(e) => setF('start_date', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">End Date</label>
              <input className="input" type="date" value={form.end_date} onChange={(e) => setF('end_date', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="select" value={form.status} onChange={(e) => setF('status', e.target.value)}>
                <option value="confirmed">Confirmed</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Monthly Rate ($)</label>
              <input className="input" type="number" value={form.monthly_rate} onChange={(e) => setF('monthly_rate', e.target.value)} />
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <button
              className="btn btn-secondary"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={handleCheckConflict}
              disabled={checking || !form.start_date || !form.end_date}
            >
              {checking ? 'Checking...' : 'Check Availability'}
            </button>
            {conflict.checked && (
              conflict.conflict
                ? <div className="conflict-alert">⚠ Conflict: {conflict.detail}</div>
                : <div className="conflict-ok">✓ No conflict. Unit available for selected dates</div>
            )}
          </div>

          <div className="info-box" style={{ marginTop: 12 }}>
            <strong>Demo tip:</strong> Select "Dale Mabry &amp; Kennedy" with dates overlapping Jun 1 to Aug 31, 2026 to trigger a live conflict.
          </div>
        </Modal>
      )}
    </div>
  );
}
