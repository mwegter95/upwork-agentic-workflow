import React, { useEffect, useState } from 'react';
import { fetchBookings, fetchCampaigns, fetchInventory } from '../api';
import { useToast } from '../contexts/ToastContext';
import type { Booking, Campaign, Unit } from '../api';

function downloadCSV(filename: string, headers: string[], rows: (string | number | undefined | null)[]) {
  const rowsArr = rows as unknown as (string | number | undefined | null)[][];
  const csv = [headers, ...rowsArr]
    .map((row) => (row as (string | number | undefined | null)[]).map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function Reports() {
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    Promise.all([fetchBookings(), fetchCampaigns(), fetchInventory()])
      .then(([b, c, u]) => { setBookings(b); setCampaigns(c); setUnits(u); })
      .finally(() => setLoading(false));
  }, []);

  const filteredBookings = bookings.filter((b) => {
    if (statusFilter && b.status !== statusFilter) return false;
    if (dateFrom && b.start_date < dateFrom) return false;
    if (dateTo && b.end_date > dateTo) return false;
    return true;
  });

  const bookingRevenue = filteredBookings
    .filter((b) => b.status === 'confirmed')
    .reduce((s, b) => s + b.monthly_rate, 0);

  const handleBookingsCSV = () => {
    const rows = filteredBookings.map((b) => [
      b.unit_name ?? '', b.unit_type ?? '', b.city ?? '', b.campaign_name ?? '',
      b.client_name ?? '', b.start_date, b.end_date, b.monthly_rate, b.status,
    ]);
    downloadCSV('adverteyes-bookings.csv',
      ['Unit', 'Type', 'City', 'Campaign', 'Client', 'Start Date', 'End Date', 'Monthly Rate', 'Status'],
      rows as unknown as (string | number)[]
    );
    toast(`Exported ${filteredBookings.length} bookings`, 'success');
  };

  const handleCampaignsCSV = () => {
    const rows = campaigns.map((c) => {
      const util = c.budget ? Math.round(((c.booked_value ?? 0) / c.budget) * 100) : 0;
      return [
        c.name, c.client_name ?? '', c.status, c.start_date, c.end_date,
        c.budget ?? 0, c.booked_value ?? 0, `${util}%`, c.booking_count ?? 0,
      ];
    });
    downloadCSV('adverteyes-campaigns.csv',
      ['Campaign', 'Client', 'Status', 'Start Date', 'End Date', 'Budget', 'Booked Value', 'Utilization', 'Bookings'],
      rows as unknown as (string | number)[]
    );
    toast(`Exported ${campaigns.length} campaigns`, 'success');
  };

  const handleInventoryCSV = () => {
    const rows = units.map((u) => {
      const cpm = u.weekly_impressions
        ? (u.monthly_rate / u.weekly_impressions * 1000).toFixed(2)
        : 'N/A';
      return [
        u.name, u.type, u.city, u.state, u.monthly_rate,
        u.weekly_impressions ?? '', cpm, u.illuminated ? 'Yes' : 'No',
        u.digital ? 'Yes' : 'No', u.status,
      ];
    });
    downloadCSV('adverteyes-inventory.csv',
      ['Name', 'Type', 'City', 'State', 'Rate/mo', 'Weekly Impressions', 'CPM', 'Illuminated', 'Digital', 'Status'],
      rows as unknown as (string | number)[]
    );
    toast(`Exported ${units.length} inventory units`, 'success');
  };

  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>;

  // Campaign summary metrics
  const campSummary = {
    active: campaigns.filter((c) => c.status === 'active'),
    upcoming: campaigns.filter((c) => c.status === 'upcoming'),
    completed: campaigns.filter((c) => c.status === 'completed'),
  };
  const totalBudget = campaigns.reduce((s, c) => s + (c.budget ?? 0), 0);
  const totalBooked = campaigns.reduce((s, c) => s + (c.booked_value ?? 0), 0);
  const avgUtilization = totalBudget > 0 ? Math.round((totalBooked / totalBudget) * 100) : 0;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, marginBottom: 4 }}>Reports</h1>
          <span className="text-muted">Export data as CSV or print a summary report</span>
        </div>
        <button
          className="btn btn-secondary no-print"
          onClick={() => window.print()}
          title="Print all reports"
        >
          🖨 Print / PDF
        </button>
      </div>

      {/* Summary KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
        <div className="card" style={{ borderTop: '3px solid var(--accent)' }}>
          <div className="form-label" style={{ marginBottom: 6 }}>Total Bookings</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--accent)' }}>{bookings.length}</div>
          <div className="text-muted text-sm" style={{ marginTop: 4 }}>
            {bookings.filter((b) => b.status === 'confirmed').length} confirmed
          </div>
        </div>
        <div className="card" style={{ borderTop: '3px solid var(--success)' }}>
          <div className="form-label" style={{ marginBottom: 6 }}>Confirmed Revenue</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--success)' }}>
            ${bookings.filter((b) => b.status === 'confirmed').reduce((s, b) => s + b.monthly_rate, 0).toLocaleString()}
          </div>
          <div className="text-muted text-sm" style={{ marginTop: 4 }}>monthly rate sum</div>
        </div>
        <div className="card" style={{ borderTop: '3px solid var(--accent-blue)' }}>
          <div className="form-label" style={{ marginBottom: 6 }}>Budget Pipeline</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--accent-blue)' }}>
            ${totalBudget.toLocaleString()}
          </div>
          <div className="text-muted text-sm" style={{ marginTop: 4 }}>{avgUtilization}% avg utilization</div>
        </div>
        <div className="card" style={{ borderTop: '3px solid var(--warning)' }}>
          <div className="form-label" style={{ marginBottom: 6 }}>Inventory Units</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--warning)' }}>{units.length}</div>
          <div className="text-muted text-sm" style={{ marginTop: 4 }}>
            {units.filter((u) => u.status === 'available').length} available
          </div>
        </div>
      </div>

      {/* Bookings Report */}
      <div className="card report-section">
        <div className="report-section-header">
          <div>
            <span className="card-title">Bookings Report</span>
            <div className="text-muted text-sm" style={{ marginTop: 2 }}>
              {filteredBookings.length} bookings
              {filteredBookings.some((b) => b.status === 'confirmed') && (
                <>, ${bookingRevenue.toLocaleString()} confirmed revenue</>
              )}
            </div>
          </div>
          <button className="btn btn-primary" onClick={handleBookingsCSV}>
            ↓ Download CSV
          </button>
        </div>

        {/* Filters */}
        <div className="toolbar" style={{ marginBottom: 16 }}>
          <select className="select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ maxWidth: 160 }}>
            <option value="">All Statuses</option>
            <option value="confirmed">Confirmed</option>
            <option value="pending">Pending</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span className="text-muted text-sm">Start from</span>
            <input className="input" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} style={{ maxWidth: 160 }} />
            <span className="text-muted text-sm">to</span>
            <input className="input" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} style={{ maxWidth: 160 }} />
            {(dateFrom || dateTo || statusFilter) && (
              <button className="btn btn-ghost btn-sm" onClick={() => { setDateFrom(''); setDateTo(''); setStatusFilter(''); }}>
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="report-preview table-wrap">
          <table>
            <thead>
              <tr>
                <th>Unit</th><th>Type</th><th>Campaign</th><th>Client</th>
                <th>Start</th><th>End</th><th>Rate/mo</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.slice(0, 10).map((b) => (
                <tr key={b.id}>
                  <td style={{ fontWeight: 500 }}>{b.unit_name ?? '-'}</td>
                  <td>{b.unit_type ? <span className={`badge badge-${b.unit_type}`}>{b.unit_type}</span> : '-'}</td>
                  <td>{b.campaign_name ?? '-'}</td>
                  <td>{b.client_name ?? '-'}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{b.start_date.slice(0, 10)}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{b.end_date.slice(0, 10)}</td>
                  <td style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>${b.monthly_rate.toLocaleString()}</td>
                  <td><span className={`badge badge-${b.status}`}>{b.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredBookings.length > 10 && (
            <div className="text-muted text-sm" style={{ padding: '10px 0' }}>
              Showing first 10 of {filteredBookings.length} rows. Download CSV for full data.
            </div>
          )}
        </div>
      </div>

      {/* Campaign Summary */}
      <div className="card report-section">
        <div className="report-section-header">
          <div>
            <span className="card-title">Campaign Summary</span>
            <div className="text-muted text-sm" style={{ marginTop: 2 }}>
              {campSummary.active.length} active, {campSummary.upcoming.length} upcoming, {campSummary.completed.length} completed
            </div>
          </div>
          <button className="btn btn-primary" onClick={handleCampaignsCSV}>
            ↓ Download CSV
          </button>
        </div>
        <div className="report-preview table-wrap">
          <table>
            <thead>
              <tr>
                <th>Campaign</th><th>Client</th><th>Status</th>
                <th>Start</th><th>End</th><th>Budget</th><th>Booked</th><th>Util %</th><th>Bookings</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => {
                const util = c.budget ? Math.round(((c.booked_value ?? 0) / c.budget) * 100) : 0;
                return (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 500 }}>{c.name}</td>
                    <td>{c.client_name ?? '-'}</td>
                    <td><span className={`badge badge-${c.status}`}>{c.status}</span></td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{c.start_date.slice(0, 10)}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{c.end_date.slice(0, 10)}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>${(c.budget ?? 0).toLocaleString()}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--success)' }}>${(c.booked_value ?? 0).toLocaleString()}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ flex: 1, height: 4, background: 'var(--border)', borderRadius: 2, minWidth: 48 }}>
                          <div style={{
                            width: `${Math.min(100, util)}%`, height: '100%', borderRadius: 2,
                            background: util > 70 ? 'var(--success)' : util > 40 ? 'var(--accent)' : 'var(--warning)',
                          }} />
                        </div>
                        <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{util}%</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)' }}>{c.booking_count ?? 0}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inventory Performance */}
      <div className="card report-section">
        <div className="report-section-header">
          <div>
            <span className="card-title">Inventory Performance</span>
            <div className="text-muted text-sm" style={{ marginTop: 2 }}>
              {units.length} units. CPM = rate / weekly impressions x 1,000
            </div>
          </div>
          <button className="btn btn-primary" onClick={handleInventoryCSV}>
            ↓ Download CSV
          </button>
        </div>
        <div className="report-preview table-wrap">
          <table>
            <thead>
              <tr>
                <th>Unit Name</th><th>Type</th><th>City</th><th>Rate/mo</th>
                <th>Wkly Impr.</th><th>CPM</th><th>Lit</th><th>Digital</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {[...units].sort((a, b) => b.monthly_rate - a.monthly_rate).map((u) => {
                const cpm = u.weekly_impressions
                  ? (u.monthly_rate / u.weekly_impressions * 1000).toFixed(2)
                  : null;
                return (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 500 }}>{u.name}</td>
                    <td><span className={`badge badge-${u.type}`}>{u.type}</span></td>
                    <td>{u.city}</td>
                    <td style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>${u.monthly_rate.toLocaleString()}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>
                      {u.weekly_impressions ? `${(u.weekly_impressions / 1000).toFixed(0)}k` : '-'}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-blue)', fontWeight: 600 }}>
                      {cpm ? `$${cpm}` : '-'}
                    </td>
                    <td style={{ textAlign: 'center' }}>{u.illuminated ? '✓' : '-'}</td>
                    <td style={{ textAlign: 'center' }}>{u.digital ? '✓' : '-'}</td>
                    <td><span className={`badge badge-${u.status}`}>{u.status}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
