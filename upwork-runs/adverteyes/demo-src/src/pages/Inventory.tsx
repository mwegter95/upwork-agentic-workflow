import React, { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { useToast } from '../contexts/ToastContext';
import {
  fetchInventory, fetchWeather, fetchTraffic, fetchTrafficBatch, fetchBookings, createUnit, updateUnit, deleteUnit,
} from '../api';
import type { Unit, WeatherData, TrafficData, TrafficBatch, Booking } from '../api';
import type { Column } from '../components/DataTable';

const TYPE_COLOR: Record<string, string> = {
  billboard: '#FF6B1A',
  dooh: '#3B82F6',
  truckside: '#EAB308',
};

const COLS: Column<Unit>[] = [
  { key: 'name', header: 'Unit Name' },
  { key: 'type', header: 'Type', render: (r) => <span className={`badge badge-${r.type}`}>{r.type}</span> },
  { key: 'city', header: 'City' },
  { key: 'state', header: 'State' },
  { key: 'status', header: 'Status', render: (r) => <span className={`badge badge-${r.status}`}>{r.status}</span> },
  {
    key: 'monthly_rate', header: 'Rate/mo',
    render: (r) => `$${r.monthly_rate.toLocaleString()}`,
    getValue: (r) => r.monthly_rate,
  },
  {
    key: 'weekly_impressions', header: 'Wkly Impr',
    render: (r) => r.weekly_impressions ? `${(r.weekly_impressions / 1000).toFixed(0)}k` : '-',
    getValue: (r) => r.weekly_impressions ?? 0,
  },
  { key: 'illuminated', header: 'Lit', render: (r) => r.illuminated ? '✓' : '-', sortable: false },
  { key: 'digital', header: 'Digital', render: (r) => r.digital ? '✓' : '-', sortable: false },
];

// ─── Unit Detail Panel ───────────────────────────────────────────────────────

const BOOKING_COLORS = ['#FF6B1A', '#3B82F6', '#22C55E', '#EAB308', '#A78BFA', '#EC4899', '#14B8A6'];
const UNIT_TL_START = new Date('2026-01-01');
const UNIT_TL_END   = new Date('2026-12-31');

function bookingBar(b: Booking) {
  const total = UNIT_TL_END.getTime() - UNIT_TL_START.getTime();
  const left  = Math.max(0, (new Date(b.start_date).getTime() - UNIT_TL_START.getTime()) / total * 100);
  const right = Math.min(100, (new Date(b.end_date).getTime() - UNIT_TL_START.getTime()) / total * 100);
  return { left: `${left}%`, width: `${Math.max(right - left, 1.5)}%` };
}

function UnitDetail({ unit, onClose }: { unit: Unit; onClose: () => void }) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [traffic, setTraffic] = useState<TrafficData | null>(null);
  const [unitBookings, setUnitBookings] = useState<Booking[]>([]);
  const [wxLoading, setWxLoading] = useState(true);

  useEffect(() => {
    setWxLoading(true);
    Promise.all([fetchWeather(unit.id), fetchTraffic(unit.id), fetchBookings({ unit_id: unit.id })])
      .then(([wx, tr, bk]) => { setWeather(wx); setTraffic(tr); setUnitBookings(bk); })
      .finally(() => setWxLoading(false));
  }, [unit.id]);

  return (
    <div className="detail-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="detail-panel">
        <div className="detail-header">
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, marginBottom: 6 }}>{unit.name}</h2>
            <div style={{ display: 'flex', gap: 6 }}>
              <span className={`badge badge-${unit.type}`}>{unit.type}</span>
              <span className={`badge badge-${unit.status}`}>{unit.status}</span>
              {unit.digital ? <span className="badge badge-dooh">DIGITAL</span> : null}
              {unit.illuminated ? <span style={{ fontSize: 11, color: 'var(--warning)' }}>💡 Illuminated</span> : null}
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>

        <div className="detail-body">
          <div className="detail-section">
            <div className="detail-section-label">Location</div>
            <div className="detail-row"><span className="detail-key">Market</span><span className="detail-val">{unit.city}, {unit.state}</span></div>
            {unit.location_desc && <div className="detail-row"><span className="detail-key">Desc.</span><span className="detail-val">{unit.location_desc}</span></div>}
            <div className="detail-row">
              <span className="detail-key">Coords</span>
              <span className="detail-val font-mono" style={{ fontSize: 11 }}>{unit.lat.toFixed(4)}, {unit.lng.toFixed(4)}</span>
            </div>
          </div>

          <div className="detail-section">
            <div className="detail-section-label">Asset Specs</div>
            {unit.width_ft && unit.height_ft && (
              <div className="detail-row"><span className="detail-key">Size</span><span className="detail-val">{unit.width_ft}' × {unit.height_ft}'</span></div>
            )}
            <div className="detail-row"><span className="detail-key">Rate/mo</span><span className="detail-val text-accent">${unit.monthly_rate.toLocaleString()}</span></div>
            {unit.weekly_impressions && (
              <div className="detail-row"><span className="detail-key">Wkly Impr.</span><span className="detail-val">{(unit.weekly_impressions / 1000).toFixed(0)}k</span></div>
            )}
            {unit.notes && <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>{unit.notes}</div>}
          </div>

          {wxLoading && <div className="spinner-wrap" style={{ padding: 24 }}><div className="spinner" /></div>}

          {weather && !wxLoading && (
            <div className="detail-section">
              <div className="detail-section-label">
                Weather {weather._isMock
                  ? <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400 }}>(sample data, API offline</span>
                  : <span style={{ fontSize: 11, color: 'var(--success)', fontWeight: 400 }}>Open-Meteo Live</span>}
              </div>
              <div className="detail-row"><span className="detail-key">Conditions</span><span className="detail-val">{weather.current.weather_desc}</span></div>
              <div className="detail-row"><span className="detail-key">Temperature</span><span className="detail-val">{weather.current.temperature}°F</span></div>
              <div className="detail-row"><span className="detail-key">Wind</span><span className="detail-val">{weather.current.wind_speed} mph (gusts {weather.current.wind_gusts} mph)</span></div>
              <div className="detail-row"><span className="detail-key">Precip.</span><span className="detail-val">{weather.current.precipitation} mm</span></div>
              <div className="detail-row">
                <span className="detail-key">Install Risk</span>
                <span className="detail-val">
                  <span className={`badge badge-risk-${weather.current.install_risk.toLowerCase()}`}>
                    {weather.current.install_risk === 'HIGH' ? '⚠ HIGH' : '✓ LOW'}
                  </span>
                </span>
              </div>
              <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', lineHeight: 1.5 }}>
                {weather.current.install_risk_reason}
              </div>
            </div>
          )}

          {traffic && !wxLoading && (
            <div className="detail-section">
              <div className="detail-section-label">
                Traffic: {traffic.source === 'tomtom' ? 'TomTom Live' : 'Estimated'}
              </div>
              <div className="detail-row">
                <span className="detail-key">Speed</span>
                <span className="detail-val">{traffic.currentSpeed} / {traffic.freeFlowSpeed} mph</span>
              </div>
              <div className="detail-row">
                <span className="detail-key">Congestion</span>
                <span className="detail-val">{traffic.congestionPct}%</span>
              </div>
              <div className="detail-row">
                <span className="detail-key">Traffic Score</span>
                <span className="detail-val">{traffic.trafficScore} / 100</span>
              </div>
              <div className="traffic-bar">
                <div
                  className="traffic-fill"
                  style={{
                    width: `${traffic.trafficScore}%`,
                    background: traffic.trafficScore > 70
                      ? 'var(--success)'
                      : traffic.trafficScore > 40
                      ? 'var(--warning)'
                      : 'var(--error)',
                  }}
                />
              </div>
              <div className="detail-row" style={{ marginTop: 8 }}>
                <span className="detail-key">Impr. Multiplier</span>
                <span className="detail-val text-accent">×{traffic.impression_multiplier.toFixed(2)}</span>
              </div>
              {traffic.roadClosure && <div className="conflict-alert" style={{ marginTop: 8 }}>⚠ Road closure detected near this unit</div>}
            </div>
          )}

          {!wxLoading && (
            <div className="detail-section">
              <div className="detail-section-label">
                Booking Availability 2026
                <span style={{ float: 'right', fontWeight: 400, fontSize: 10, color: 'var(--text-muted)' }}>
                  Jan to Dec 2026
                </span>
              </div>
              {unitBookings.length === 0 ? (
                <div style={{ fontSize: 12, color: 'var(--success)', padding: '6px 0' }}>✓ No bookings on record, unit fully available in 2026</div>
              ) : (
                <>
                  <div className="unit-avail-track">
                    {unitBookings.filter((b) => b.status !== 'cancelled').map((b, i) => {
                      const { left, width } = bookingBar(b);
                      return (
                        <div
                          key={b.id}
                          className="unit-avail-bar"
                          style={{ left, width, background: BOOKING_COLORS[i % BOOKING_COLORS.length] }}
                          title={`${b.campaign_name ?? 'Booking'}: ${b.start_date.slice(0, 10)} to ${b.end_date.slice(0, 10)} $${b.monthly_rate.toLocaleString()}/mo`}
                        />
                      );
                    })}
                  </div>
                  <div style={{ marginTop: 8 }}>
                    {unitBookings.filter((b) => b.status !== 'cancelled').map((b, i) => (
                      <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, fontSize: 12 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: BOOKING_COLORS[i % BOOKING_COLORS.length], flexShrink: 0 }} />
                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {b.campaign_name ?? `Campaign ${b.campaign_id}`}
                        </span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>
                          {b.start_date.slice(0, 10)} to {b.end_date.slice(0, 10)}
                        </span>
                        <span className={`badge badge-${b.status}`} style={{ fontSize: 10, flexShrink: 0 }}>{b.status}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Map View ────────────────────────────────────────────────────────────────

function MapView({ units, onSelect, trafficMap }: { units: Unit[]; onSelect: (u: Unit) => void; trafficMap: Map<number, number> }) {
  return (
    <div className="map-container" style={{ marginTop: 16, position: 'relative' }}>
      <MapContainer center={[27.95, -82.46]} zoom={11} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/" target="_blank">CARTO</a>'
        />
        {units.map((u) => {
          const score = trafficMap.get(u.id) ?? 65;
          return (
            <CircleMarker
              key={u.id}
              center={[u.lat, u.lng]}
              radius={u.type === 'dooh' ? 12 : u.type === 'billboard' ? 10 : 9}
              pathOptions={{
                color: TYPE_COLOR[u.type] ?? '#888',
                fillColor: TYPE_COLOR[u.type] ?? '#888',
                fillOpacity: u.status === 'maintenance' ? 0.2 : 0.45 + (score / 100) * 0.5,
                weight: u.status === 'maintenance' ? 1 : 2,
              }}
              eventHandlers={{ click: () => onSelect(u) }}
            >
              <Popup>
                <div style={{ minWidth: 180, fontFamily: 'system-ui, sans-serif' }}>
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4, color: '#111' }}>{u.name}</div>
                  <div style={{ fontSize: 11, color: '#555', marginBottom: 6 }}>{u.city}, {u.state}</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                    <span style={{ background: TYPE_COLOR[u.type] + '22', color: TYPE_COLOR[u.type], border: `1px solid ${TYPE_COLOR[u.type]}`, borderRadius: 3, padding: '1px 6px', fontSize: 10, fontWeight: 600 }}>{u.type.toUpperCase()}</span>
                    <span style={{ background: u.status === 'available' ? '#22C55E22' : u.status === 'booked' ? '#FF6B1A22' : '#EAB30822', color: u.status === 'available' ? '#22C55E' : u.status === 'booked' ? '#FF6B1A' : '#EAB308', border: `1px solid ${u.status === 'available' ? '#22C55E' : u.status === 'booked' ? '#FF6B1A' : '#EAB308'}`, borderRadius: 3, padding: '1px 6px', fontSize: 10, fontWeight: 600 }}>{u.status}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px', fontSize: 11 }}>
                    <div style={{ color: '#888' }}>Rate/mo</div>
                    <div style={{ fontWeight: 600, color: '#FF6B1A' }}>${u.monthly_rate.toLocaleString()}</div>
                    {u.weekly_impressions && <>
                      <div style={{ color: '#888' }}>Weekly Impr.</div>
                      <div style={{ fontWeight: 600 }}>{(u.weekly_impressions / 1000).toFixed(0)}k</div>
                    </>}
                    <div style={{ color: '#888' }}>Traffic score</div>
                    <div style={{ fontWeight: 600, color: score >= 80 ? '#22C55E' : score >= 55 ? '#EAB308' : '#EF4444' }}>{score}</div>
                  </div>
                  <div style={{ marginTop: 8, borderTop: '1px solid #eee', paddingTop: 6, fontSize: 10, color: '#888' }}>
                    Click marker to open full detail panel
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
      <div className="map-legend">
        <div className="map-legend-title">Ad Unit Types</div>
        {[['billboard', '#FF6B1A'], ['dooh', '#3B82F6'], ['truckside', '#EAB308']].map(([t, c]) => (
          <div key={t} className="map-legend-item">
            <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: c, marginRight: 6 }} />
            {t}
          </div>
        ))}
        <div className="map-legend-title" style={{ marginTop: 8 }}>Opacity = traffic score</div>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

const EMPTY_UNIT: Partial<Unit> = {
  type: 'billboard',
  status: 'available',
  monthly_rate: 0,
  lat: 27.95,
  lng: -82.46,
  city: 'Tampa',
  state: 'FL',
  illuminated: 0,
  digital: 0,
};

export default function Inventory() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [view, setView] = useState<'table' | 'map'>('table');
  const [selected, setSelected] = useState<Unit | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editUnit, setEditUnit] = useState<Partial<Unit>>(EMPTY_UNIT);
  const [saving, setSaving] = useState(false);
  const [trafficMap, setTrafficMap] = useState<Map<number, number>>(new Map());
  const [deleteTarget, setDeleteTarget] = useState<Unit | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (view !== 'map') return;
    fetchTrafficBatch().then((t) => {
      setTrafficMap(new Map(t.map((tr: TrafficBatch) => [tr.id, tr.trafficScore])));
    });
  }, [view]);

  const load = useCallback(() => {
    setLoading(true);
    fetchInventory().then(setUnits).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = units.filter((u) => {
    if (typeFilter && u.type !== typeFilter) return false;
    if (statusFilter && u.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!u.name.toLowerCase().includes(q) && !u.city.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const markets = new Set(units.map((u) => u.city)).size;

  const openNew = () => { setEditUnit({ ...EMPTY_UNIT }); setShowModal(true); };
  const openEdit = (u: Unit) => { setEditUnit({ ...u }); setShowModal(true); };

  const handleSave = async () => {
    if (!editUnit.name || !editUnit.lat || !editUnit.lng) {
      toast('Name and coordinates are required', 'warn'); return;
    }
    setSaving(true);
    try {
      if (editUnit.id) await updateUnit(editUnit.id, editUnit);
      else await createUnit(editUnit);
      setShowModal(false);
      load();
      toast(editUnit.id ? 'Unit updated' : 'Unit added', 'success');
    } catch { toast('Save failed . API may be offline', 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = (u: Unit, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteTarget(u);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteUnit(deleteTarget.id);
      load();
      toast(`"${deleteTarget.name}" deleted`, 'info');
    } catch { toast('Delete failed . API may be offline', 'error'); }
    finally { setDeleteTarget(null); }
  };

  const set = <K extends keyof Unit>(k: K, v: Unit[K]) =>
    setEditUnit((p) => ({ ...p, [k]: v }));

  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>;

  // Market summary by city
  const marketSummary = Array.from(
    units.reduce((acc, u) => {
      const m = acc.get(u.city) ?? { city: u.city, available: 0, booked: 0, maintenance: 0, total: 0 };
      m.total++;
      if (u.status === 'available') m.available++;
      else if (u.status === 'booked') m.booked++;
      else m.maintenance++;
      return acc.set(u.city, m);
    }, new Map<string, { city: string; available: number; booked: number; maintenance: number; total: number }>())
  ).map(([, v]) => v).sort((a, b) => b.total - a.total);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28 }}>Inventory</h1>
          <span className="text-muted">{units.length} ad units across {markets} market{markets !== 1 ? 's' : ''}</span>
        </div>
        <button className="btn btn-primary" onClick={openNew}>+ Add Unit</button>
      </div>

      {/* Market summary cards */}
      <div className="market-summary-row">
        {marketSummary.map((m) => {
          const occ = Math.round(m.booked / m.total * 100);
          return (
            <div
              key={m.city}
              className={`market-card${statusFilter === '' && search === '' && typeFilter === '' ? '' : ''}`}
              onClick={() => { setSearch(m.city); setTypeFilter(''); setStatusFilter(''); }}
              style={{ cursor: 'pointer' }}
            >
              <div className="market-card-city">{m.city}</div>
              <div className="market-card-stats">
                <span style={{ color: 'var(--success)' }}>{m.available} avail</span>
                <span className="text-muted">·</span>
                <span style={{ color: 'var(--accent)' }}>{m.booked} booked</span>
                {m.maintenance > 0 && <><span className="text-muted">·</span><span style={{ color: 'var(--warning)' }}>{m.maintenance} maint.</span></>}
              </div>
              <div className="budget-progress-wrap" style={{ marginTop: 8 }}>
                <div className="budget-progress-fill" style={{
                  width: `${occ}%`,
                  background: occ > 70 ? 'var(--accent)' : occ > 40 ? 'var(--accent-blue)' : 'var(--border)',
                }} />
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3, fontFamily: 'var(--font-mono)' }}>{occ}% occupied</div>
            </div>
          );
        })}
        <div className="market-card" style={{ cursor: 'default', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--accent)', textAlign: 'center' }}>{Math.round(units.filter((u) => u.status === 'booked').length / units.length * 100)}%</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', marginTop: 4 }}>Fleet Occupancy</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center' }}>{units.filter((u) => u.status === 'available').length} available now</div>
        </div>
      </div>

      <div className="toolbar">
        <input
          className="input"
          placeholder="Search name or city..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 220 }}
        />
        <select className="select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={{ maxWidth: 160 }}>
          <option value="">All Types</option>
          <option value="billboard">Billboard</option>
          <option value="dooh">DOOH</option>
          <option value="truckside">Truckside</option>
        </select>
        <select className="select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ maxWidth: 160 }}>
          <option value="">All Statuses</option>
          <option value="available">Available</option>
          <option value="booked">Booked</option>
          <option value="maintenance">Maintenance</option>
        </select>
        <div style={{ marginLeft: 'auto' }}>
          <div className="view-toggle">
            <button className={`view-btn${view === 'table' ? ' active' : ''}`} onClick={() => setView('table')}>Table</button>
            <button className={`view-btn${view === 'map' ? ' active' : ''}`} onClick={() => setView('map')}>Map</button>
          </div>
        </div>
      </div>

      {view === 'table' ? (
        <div className="card">
          <DataTable
            data={filtered}
            columns={[
              ...COLS,
              {
                key: 'actions',
                header: '',
                sortable: false,
                render: (r) => (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); openEdit(r); }}>Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={(e) => handleDelete(r, e)}>Del</button>
                  </div>
                ),
              },
            ]}
            rowKey={(r) => r.id}
            onRowClick={setSelected}
            selectedId={selected?.id}
          />
        </div>
      ) : (
        <MapView units={filtered} onSelect={setSelected} trafficMap={trafficMap} />
      )}

      {selected && <UnitDetail unit={selected} onClose={() => setSelected(null)} />}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete Unit"
          message={`Delete "${deleteTarget.name}"? This cannot be undone.`}
          confirmLabel="Delete"
          danger
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {showModal && (
        <Modal
          title={editUnit.id ? 'Edit Unit' : 'Add Unit'}
          onClose={() => setShowModal(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Unit'}
              </button>
            </>
          }
        >
          <div className="form-grid-2">
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Unit Name *</label>
              <input className="input" value={editUnit.name ?? ''} onChange={(e) => set('name', e.target.value)} placeholder="e.g. I-275 North Gateway" />
            </div>
            <div className="form-group">
              <label className="form-label">Type</label>
              <select className="select" value={editUnit.type ?? 'billboard'} onChange={(e) => set('type', e.target.value as Unit['type'])}>
                <option value="billboard">Billboard</option>
                <option value="dooh">DOOH</option>
                <option value="truckside">Truckside</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="select" value={editUnit.status ?? 'available'} onChange={(e) => set('status', e.target.value as Unit['status'])}>
                <option value="available">Available</option>
                <option value="booked">Booked</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">City</label>
              <input className="input" value={editUnit.city ?? ''} onChange={(e) => set('city', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">State</label>
              <input className="input" value={editUnit.state ?? ''} onChange={(e) => set('state', e.target.value)} maxLength={2} placeholder="FL" />
            </div>
            <div className="form-group">
              <label className="form-label">Latitude *</label>
              <input className="input" type="number" step="0.0001" value={editUnit.lat ?? ''} onChange={(e) => set('lat', parseFloat(e.target.value))} />
            </div>
            <div className="form-group">
              <label className="form-label">Longitude *</label>
              <input className="input" type="number" step="0.0001" value={editUnit.lng ?? ''} onChange={(e) => set('lng', parseFloat(e.target.value))} />
            </div>
            <div className="form-group">
              <label className="form-label">Monthly Rate ($)</label>
              <input className="input" type="number" value={editUnit.monthly_rate ?? ''} onChange={(e) => set('monthly_rate', parseFloat(e.target.value))} />
            </div>
            <div className="form-group">
              <label className="form-label">Wkly Impressions</label>
              <input className="input" type="number" value={editUnit.weekly_impressions ?? ''} onChange={(e) => set('weekly_impressions', parseInt(e.target.value))} />
            </div>
            <div className="form-group">
              <label className="form-label">Width (ft)</label>
              <input className="input" type="number" value={editUnit.width_ft ?? ''} onChange={(e) => set('width_ft', parseInt(e.target.value))} />
            </div>
            <div className="form-group">
              <label className="form-label">Height (ft)</label>
              <input className="input" type="number" value={editUnit.height_ft ?? ''} onChange={(e) => set('height_ft', parseInt(e.target.value))} />
            </div>
            <div className="form-group">
              <label className="form-label">Illuminated</label>
              <select className="select" value={editUnit.illuminated ?? 0} onChange={(e) => set('illuminated', parseInt(e.target.value))}>
                <option value={0}>No</option>
                <option value={1}>Yes</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Digital</label>
              <select className="select" value={editUnit.digital ?? 0} onChange={(e) => set('digital', parseInt(e.target.value))}>
                <option value={0}>No</option>
                <option value={1}>Yes</option>
              </select>
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Notes</label>
              <textarea className="textarea" value={editUnit.notes ?? ''} onChange={(e) => set('notes', e.target.value)} style={{ minHeight: 60 }} />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
