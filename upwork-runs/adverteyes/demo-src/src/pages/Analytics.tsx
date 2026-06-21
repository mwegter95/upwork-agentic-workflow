import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  AreaChart, Area, ReferenceLine, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { fetchInventory, fetchCampaigns, fetchBookings } from '../api';
import type { Unit, Campaign, Booking } from '../api';

const ALL_OCCUPANCY_TREND = [
  { week: 'Mar W1', pct: 40 }, { week: 'Mar W2', pct: 43 }, { week: 'Mar W3', pct: 45 }, { week: 'Mar W4', pct: 48 },
  { week: 'Apr W1', pct: 49 }, { week: 'Apr W2', pct: 51 }, { week: 'Apr W3', pct: 52 }, { week: 'Apr W4', pct: 55 },
  { week: 'May W1', pct: 58 }, { week: 'May W2', pct: 63 }, { week: 'May W3', pct: 67 }, { week: 'May W4', pct: 71 },
  { week: 'Jun W1', pct: 75 }, { week: 'Jun W2', pct: 78 }, { week: 'Jun W3', pct: 81 }, { week: 'Jun W4', pct: 83 },
];

const ALL_FORECAST_DATA = [
  { week: 'Mar W1', actual: 22100 }, { week: 'Mar W2', actual: 25300 }, { week: 'Mar W3', actual: 28400 }, { week: 'Mar W4', actual: 31800 },
  { week: 'Apr W1', actual: 34200 }, { week: 'Apr W2', actual: 36500 }, { week: 'Apr W3', actual: 38200 }, { week: 'Apr W4', actual: 41600 },
  { week: 'May W1', actual: 44000 }, { week: 'May W2', actual: 48500 }, { week: 'May W3', actual: 53100 }, { week: 'May W4', actual: 58400 },
  { week: 'Jun W1', actual: 62800 }, { week: 'Jun W2', actual: 68200, projected: 68200 },
  { week: 'Jun W3', projected: 73500 }, { week: 'Jun W4', projected: 79200 }, { week: 'Jul W1', projected: 85400 }, { week: 'Jul W2', projected: 91800 },
];

const fmtUSD = (v: number) => `$${v.toLocaleString()}`;

const TooltipStyle = {
  contentStyle: {
    background: 'var(--bg-elevated)', border: '1px solid var(--border)',
    borderRadius: 6, fontSize: 12, color: 'var(--text-primary)',
  },
};

export default function Analytics() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<4 | 8 | 12>(8);

  useEffect(() => {
    Promise.all([fetchInventory(), fetchCampaigns(), fetchBookings()])
      .then(([u, c, b]) => { setUnits(u); setCampaigns(c); setBookings(b); })
      .finally(() => setLoading(false));
  }, []);

  // Derived analytics from live data
  const pipeline = {
    active: campaigns.filter((c) => c.status === 'active').reduce((s, c) => s + (c.budget ?? 0), 0),
    upcoming: campaigns.filter((c) => c.status === 'upcoming').reduce((s, c) => s + (c.budget ?? 0), 0),
  };

  // Revenue by client from campaign booked_value
  const revenueByClient = Object.entries(
    campaigns.reduce((acc, c) => {
      if (c.client_name && c.booked_value) {
        acc[c.client_name] = (acc[c.client_name] ?? 0) + c.booked_value;
      }
      return acc;
    }, {} as Record<string, number>)
  )
    .map(([client, revenue]) => ({ client, revenue }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 6);

  const topUnits = [...units].sort((a, b) => b.monthly_rate - a.monthly_rate).slice(0, 8);

  // Revenue by Market (city) from confirmed bookings monthly_rate
  const revenueByCity = Object.entries(
    bookings
      .filter((b) => b.status === 'confirmed')
      .reduce((acc, b) => {
        const city = b.city ?? 'Unknown';
        acc[city] = (acc[city] ?? 0) + b.monthly_rate;
        return acc;
      }, {} as Record<string, number>)
  )
    .map(([city, revenue]) => ({ city, revenue }))
    .sort((a, b) => b.revenue - a.revenue);

  // Units by market: available/booked count per city
  const unitsByCity = Object.entries(
    units.reduce((acc, u) => {
      if (!acc[u.city]) acc[u.city] = { available: 0, booked: 0, maintenance: 0, totalRate: 0 };
      acc[u.city][u.status]++;
      acc[u.city].totalRate += u.monthly_rate;
      return acc;
    }, {} as Record<string, { available: number; booked: number; maintenance: number; totalRate: number }>)
  )
    .map(([city, stats]) => ({
      city,
      ...stats,
      total: stats.available + stats.booked + stats.maintenance,
      occupancy: Math.round(stats.booked / (stats.available + stats.booked + stats.maintenance) * 100),
    }))
    .sort((a, b) => b.booked - a.booked);

  // Reach & Impressions (all units, impressions are traffic-based regardless of booking status)
  const REACH_COLORS: Record<string, string> = { Billboard: '#FF6B1A', DOOH: '#3B82F6', Truckside: '#EAB308' };
  const reachByType = (['billboard', 'dooh', 'truckside'] as const).map((type) => {
    const label = type === 'dooh' ? 'DOOH' : type.charAt(0).toUpperCase() + type.slice(1);
    const impressions = units.filter((u) => u.type === type).reduce((s, u) => s + (u.weekly_impressions ?? 0), 0);
    const avgRate = units.filter((u) => u.type === type).reduce((s, u) => s + u.monthly_rate, 0) / (units.filter((u) => u.type === type).length || 1);
    const cpmReach = impressions > 0 ? Math.round(impressions / (avgRate / 1000)) : 0; // impressions per $1k spent/mo
    return { type: label, impressions, cpmReach };
  }).filter((r) => r.impressions > 0);
  const totalWeeklyReach = reachByType.reduce((s, r) => s + r.impressions, 0);

  const cpmByType = (['billboard', 'dooh', 'truckside'] as const).map((type) => {
    const typeUnits = units.filter((u) => u.type === type);
    if (!typeUnits.length) return null;
    const avgRate = typeUnits.reduce((s, u) => s + u.monthly_rate, 0) / typeUnits.length;
    const avgImpr = typeUnits.filter((u) => u.weekly_impressions).reduce((s, u) => s + (u.weekly_impressions ?? 0), 0) / (typeUnits.filter((u) => u.weekly_impressions).length || 1);
    const cpm = avgImpr > 0 ? (avgRate / avgImpr * 1000).toFixed(2) : '0.00';
    const label = type === 'dooh' ? 'DOOH' : type.charAt(0).toUpperCase() + type.slice(1);
    return { type: label, avgRate: Math.round(avgRate), avgImpr: Math.round(avgImpr), cpm, units: typeUnits.length };
  }).filter(Boolean) as { type: string; avgRate: number; avgImpr: number; cpm: string; units: number }[];

  const currentOccupancy = units.length > 0
    ? Math.round(units.filter((u) => u.status === 'booked').length / units.length * 100)
    : ALL_OCCUPANCY_TREND[ALL_OCCUPANCY_TREND.length - 1].pct;

  // Date-range-filtered chart data
  const occupancyTrend = ALL_OCCUPANCY_TREND.slice(-range);
  // forecast: last `range` actual weeks + all projected (trailing 4)
  const actualAll = ALL_FORECAST_DATA.filter((d) => 'actual' in d && d.actual != null);
  const projectedAll = ALL_FORECAST_DATA.filter((d) => 'projected' in d && !('actual' in d));
  const forecastData = [...actualAll.slice(-range), ...projectedAll];

  // Occupancy by type
  const occupancyByType = (['billboard', 'dooh', 'truckside'] as const).map((type) => {
    const g = units.filter((u) => u.type === type);
    const booked = g.filter((u) => u.status === 'booked').length;
    return {
      type: type === 'dooh' ? 'DOOH' : type.charAt(0).toUpperCase() + type.slice(1),
      Booked: booked,
      Available: g.filter((u) => u.status === 'available').length,
      Maintenance: g.filter((u) => u.status === 'maintenance').length,
      pct: g.length ? Math.round(booked / g.length * 100) : 0,
    };
  });

  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, marginBottom: 4 }}>Analytics</h1>
          <span className="text-muted">Revenue, occupancy, and pipeline, Tampa Bay market</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="text-muted text-sm">Range</span>
          <div className="view-toggle">
            {([4, 8, 12] as const).map((r) => (
              <button
                key={r}
                className={`view-btn${range === r ? ' active' : ''}`}
                onClick={() => setRange(r)}
              >
                {r}W
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Pipeline KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        <div className="card" style={{ borderTop: '3px solid var(--success)' }}>
          <div className="text-muted text-sm" style={{ textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>Active Budget</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, color: 'var(--success)' }}>{fmtUSD(pipeline.active)}</div>
          <div className="text-muted text-xs" style={{ marginTop: 4 }}>{campaigns.filter((c) => c.status === 'active').length} active campaigns</div>
        </div>
        <div className="card" style={{ borderTop: '3px solid var(--accent-blue)' }}>
          <div className="text-muted text-sm" style={{ textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>Pipeline Budget</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, color: 'var(--accent-blue)' }}>{fmtUSD(pipeline.upcoming)}</div>
          <div className="text-muted text-xs" style={{ marginTop: 4 }}>{campaigns.filter((c) => c.status === 'upcoming').length} upcoming campaigns</div>
        </div>
        <div className="card" style={{ borderTop: '3px solid var(--accent)' }}>
          <div className="text-muted text-sm" style={{ textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>Total Inventory</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, color: 'var(--accent)' }}>{units.length}</div>
          <div className="text-muted text-xs" style={{ marginTop: 4 }}>{units.filter((u) => u.status === 'available').length} available now</div>
        </div>
        <div className="card" style={{ borderTop: '3px solid var(--warning)' }}>
          <div className="text-muted text-sm" style={{ textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>Occupancy Rate</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, color: 'var(--warning)' }}>{currentOccupancy}%</div>
          <div className="text-muted text-xs" style={{ marginTop: 4 }}>{units.filter((u) => u.status === 'booked').length} of {units.length} units booked</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Revenue by Client */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Revenue by Client: Booked Value</span>
            <span className="text-muted text-sm">from live campaigns</span>
          </div>
          {revenueByClient.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart layout="vertical" data={revenueByClient} margin={{ left: 0, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis
                  type="number" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false}
                />
                <YAxis
                  type="category" dataKey="client" width={130}
                  tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false}
                />
                <Tooltip {...TooltipStyle} formatter={(v: number) => [fmtUSD(v), 'Booked Value']} />
                <Bar dataKey="revenue" fill="var(--accent)" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state"><div className="empty-state-text">No campaign data</div></div>
          )}
        </div>

        {/* Occupancy Trend */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Occupancy Trend: Last 8 Weeks</span>
            <span className="text-muted text-sm">Current: {currentOccupancy}%</span>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={occupancyTrend}>
              <defs>
                <linearGradient id="occGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="week" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} unit="%" domain={[40, 90]} />
              <Tooltip {...TooltipStyle} formatter={(v: number) => [`${v}%`, 'Occupancy']} />
              <ReferenceLine y={currentOccupancy} stroke="var(--accent)" strokeDasharray="4 3" />
              <Area type="monotone" dataKey="pct" stroke="var(--accent)" strokeWidth={2} fill="url(#occGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Occupancy by type bar */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <span className="card-title">Occupancy by Unit Type</span>
          <span className="text-muted text-sm">Booked / Available / Maintenance</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {occupancyByType.map((row) => (
            <div key={row.type}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span className={`badge badge-${row.type.toLowerCase()}`}>{row.type}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-muted)' }}>{row.Booked}/{row.Booked + row.Available + row.Maintenance}</span>
              </div>
              <div className="budget-progress-wrap">
                <div className="budget-progress-fill" style={{ width: `${row.pct}%`, background: row.pct > 70 ? 'var(--success)' : row.pct > 40 ? 'var(--accent)' : 'var(--warning)' }} />
              </div>
              <div style={{ marginTop: 4, fontSize: 12, color: 'var(--text-muted)' }}>{row.pct}% occupancy</div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Units Table */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <span className="card-title">Top Units by Monthly Revenue</span>
          <span className="text-muted text-sm">Live inventory data</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Unit Name</th>
                <th>Type</th>
                <th>City</th>
                <th>Rate/mo</th>
                <th>Wkly Impr.</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {topUnits.map((u, i) => (
                <tr key={u.id}>
                  <td style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', width: 32 }}>{i + 1}</td>
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

      {/* Revenue Forecast */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <span className="card-title">Revenue Forecast: 8-Week Actual + 4-Week Projection</span>
          <div style={{ display: 'flex', gap: 16, fontSize: 11 }}>
            <span style={{ color: 'var(--accent)' }}>Actual</span>
            <span style={{ color: 'var(--accent-blue)' }}>- - Projected</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={forecastData} margin={{ right: 16 }}>
            <defs>
              <linearGradient id="forecastActGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.2} />
                <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="week" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              {...TooltipStyle}
              formatter={(v: number, name: string) => [fmtUSD(v), name === 'actual' ? 'Actual Revenue' : 'Projected Revenue']}
            />
            <Area type="monotone" dataKey="actual" stroke="var(--accent)" strokeWidth={2} fill="url(#forecastActGrad)" connectNulls={false} />
            <Area type="monotone" dataKey="projected" stroke="var(--accent-blue)" strokeWidth={2} strokeDasharray="5 3" fill="none" connectNulls={false} />
          </AreaChart>
        </ResponsiveContainer>
        {(() => {
          const lastActual = [...actualAll.slice(-range)].reverse().find((d) => d.actual != null);
          const peakProjected = projectedAll.reduce((mx, d) => Math.max(mx, d.projected ?? 0), 0);
          const firstActualInRange = actualAll.slice(-range)[0];
          const growthPct = firstActualInRange && lastActual && firstActualInRange.actual
            ? Math.round(((lastActual.actual! - firstActualInRange.actual) / firstActualInRange.actual) * 100)
            : 0;
          return (
            <div style={{ marginTop: 8, padding: '0 8px', display: 'flex', gap: 24 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Latest actual: <span style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>${(lastActual?.actual ?? 0).toLocaleString()}</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                4-wk forecast peak: <span style={{ color: 'var(--accent-blue)', fontFamily: 'var(--font-mono)' }}>${peakProjected.toLocaleString()}</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {range}W growth: <span style={{ color: 'var(--success)', fontFamily: 'var(--font-mono)' }}>+{growthPct}%</span>
              </div>
            </div>
          );
        })()}
      </div>

      {/* CPM Efficiency */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="card">
          <div className="card-header">
            <span className="card-title">CPM by Unit Type</span>
            <span className="text-muted text-sm">Revenue per 1,000 weekly impressions</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart layout="vertical" data={[...cpmByType].sort((a, b) => parseFloat(b.cpm) - parseFloat(a.cpm))} margin={{ left: 0, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
              <YAxis type="category" dataKey="type" width={80} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip {...TooltipStyle} formatter={(v: number) => [`$${v}/CPM`, 'Revenue per 1k Impr.']} />
              <Bar dataKey="cpm" fill="var(--accent-blue)" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Unit Type Efficiency Breakdown</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Units</th>
                  <th>Avg Rate/mo</th>
                  <th>Avg Wkly Impr.</th>
                  <th>CPM</th>
                </tr>
              </thead>
              <tbody>
                {[...cpmByType].sort((a, b) => parseFloat(b.cpm) - parseFloat(a.cpm)).map((row) => (
                  <tr key={row.type}>
                    <td><span className={`badge badge-${row.type.toLowerCase()}`}>{row.type}</span></td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{row.units}</td>
                    <td style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>${row.avgRate.toLocaleString()}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{(row.avgImpr / 1000).toFixed(0)}k</td>
                    <td style={{ color: 'var(--accent-blue)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>${row.cpm}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="text-muted text-xs" style={{ marginTop: 10, lineHeight: 1.5 }}>
            CPM = monthly rate / weekly impressions x 1,000. Higher CPM = more revenue extracted per thousand weekly views.
          </div>
        </div>
      </div>

      {/* Revenue by Market (city) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 20 }}>
        <div className="card">
          <div className="card-header">
            <span className="card-title">Revenue by Market</span>
            <span className="text-muted text-sm">Confirmed booking monthly rates by city</span>
          </div>
          {revenueByCity.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart layout="vertical" data={revenueByCity} margin={{ left: 0, right: 24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="city" width={90}
                  tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip {...TooltipStyle} formatter={(v: number) => [fmtUSD(v), 'Monthly Revenue']} />
                <Bar dataKey="revenue" fill="var(--success)" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state"><div className="empty-state-text">No booking data</div></div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Inventory by Market</span>
            <span className="text-muted text-sm">Unit count and occupancy per city</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>City</th>
                  <th>Total</th>
                  <th>Booked</th>
                  <th>Available</th>
                  <th>Maint.</th>
                  <th>Occupancy</th>
                </tr>
              </thead>
              <tbody>
                {unitsByCity.map((row) => (
                  <tr key={row.city}>
                    <td style={{ fontWeight: 500 }}>{row.city}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{row.total}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>{row.booked}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--success)' }}>{row.available}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--warning)' }}>{row.maintenance}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ flex: 1, height: 5, background: 'var(--border)', borderRadius: 2, minWidth: 56 }}>
                          <div style={{
                            width: `${row.occupancy}%`, height: '100%', borderRadius: 2,
                            background: row.occupancy > 70 ? 'var(--success)' : row.occupancy > 40 ? 'var(--accent)' : 'var(--warning)',
                          }} />
                        </div>
                        <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{row.occupancy}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Reach & Impression Analytics */}
      <div style={{ marginTop: 20 }}>
        <div className="card">
          <div className="card-header">
            <span className="card-title">Weekly Reach by Unit Type</span>
            <span className="text-muted text-sm">
              {totalWeeklyReach > 0 ? `${(totalWeeklyReach / 1000000).toFixed(2)}M` : '--'} total weekly impressions
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            {/* Donut */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={reachByType} dataKey="impressions" nameKey="type" innerRadius={55} outerRadius={90} paddingAngle={3}>
                    {reachByType.map((entry) => (
                      <Cell key={entry.type} fill={REACH_COLORS[entry.type] ?? '#888'} />
                    ))}
                  </Pie>
                  <Tooltip
                    {...TooltipStyle}
                    formatter={(v: number) => [`${(v / 1000).toFixed(0)}k / wk`, 'Impressions']}
                  />
                  <Legend
                    formatter={(value) => (
                      <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Breakdown */}
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 20 }}>
              <div>
                <div className="text-muted" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>Total Weekly Reach</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 40, color: 'var(--accent)', lineHeight: 1 }}>
                  {totalWeeklyReach > 0 ? `${(totalWeeklyReach / 1000000).toFixed(2)}M` : '--'}
                </div>
                <div className="text-muted text-sm" style={{ marginTop: 4 }}>impressions / week across {units.length} units</div>
              </div>
              <div>
                {reachByType.map((rt) => {
                  const pct = totalWeeklyReach > 0 ? Math.round((rt.impressions / totalWeeklyReach) * 100) : 0;
                  return (
                    <div key={rt.type} style={{ marginBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: REACH_COLORS[rt.type] ?? '#888' }} />
                          <span style={{ fontSize: 12 }}>{rt.type}</span>
                        </span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>
                          {(rt.impressions / 1000).toFixed(0)}k / wk
                        </span>
                      </div>
                      <div style={{ height: 5, background: 'var(--border)', borderRadius: 2 }}>
                        <div style={{ width: `${pct}%`, height: '100%', borderRadius: 2, background: REACH_COLORS[rt.type] ?? '#888' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                <div className="text-muted" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>Reach Efficiency (impressions / $1k monthly)</div>
                {reachByType.map((rt) => (
                  <div key={rt.type} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span>{rt.type}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-blue)', fontWeight: 600 }}>
                      {rt.cpmReach.toLocaleString()} impr / $1k
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
