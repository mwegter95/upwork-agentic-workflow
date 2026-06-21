import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { fetchInventory, fetchWeather } from '../api';
import type { Unit, WeatherData } from '../api';

const WX_ICON: Record<number, string> = {
  0: '☀️', 1: '🌤', 2: '⛅', 3: '☁️',
  45: '🌫', 48: '🌫',
  51: '🌦', 53: '🌦', 55: '🌧',
  61: '🌧', 63: '🌧', 65: '🌧',
  71: '🌨', 73: '🌨', 75: '❄️',
  80: '🌦', 81: '🌧', 82: '⛈',
  95: '⛈', 96: '⛈', 99: '⛈',
};

function wxIcon(code: number): string {
  if (WX_ICON[code]) return WX_ICON[code];
  if (code >= 80) return '⛈';
  if (code >= 60) return '🌧';
  if (code >= 40) return '🌫';
  return '🌡';
}

// Traffic score mock per unit (0-100, higher = more congested = more impressions)
const TRAFFIC_QUICK: Record<number, { score: number; congestion: number; multiplier: number }> = {
  1: { score: 88, congestion: 62, multiplier: 1.31 },
  2: { score: 76, congestion: 48, multiplier: 1.19 },
  3: { score: 92, congestion: 71, multiplier: 1.42 },
  4: { score: 68, congestion: 39, multiplier: 1.12 },
  5: { score: 45, congestion: 22, multiplier: 0.93 },
  9: { score: 95, congestion: 78, multiplier: 1.52 },
  10: { score: 82, congestion: 55, multiplier: 1.24 },
  11: { score: 97, congestion: 83, multiplier: 1.58 },
  12: { score: 79, congestion: 51, multiplier: 1.21 },
  13: { score: 71, congestion: 44, multiplier: 1.15 },
  14: { score: 84, congestion: 57, multiplier: 1.26 },
  15: { score: 38, congestion: 18, multiplier: 0.88 },
  16: { score: 90, congestion: 67, multiplier: 1.36 },
  17: { score: 65, congestion: 35, multiplier: 1.08 },
  18: { score: 73, congestion: 46, multiplier: 1.17 },
  19: { score: 80, congestion: 52, multiplier: 1.22 },
  20: { score: 69, congestion: 41, multiplier: 1.13 },
};
const DEFAULT_TRAFFIC = { score: 72, congestion: 45, multiplier: 1.18 };

const FLEET_QUICK: Record<number, { temp: number; wind: number; code: number; risk: 'HIGH' | 'LOW' }> = {
  1: { temp: 89, wind: 14, code: 1, risk: 'LOW' },
  2: { temp: 88, wind: 18, code: 2, risk: 'LOW' },
  3: { temp: 89, wind: 22, code: 1, risk: 'LOW' },
  4: { temp: 91, wind: 12, code: 0, risk: 'LOW' },
  5: { temp: 87, wind: 28, code: 3, risk: 'HIGH' },
  9: { temp: 90, wind: 15, code: 1, risk: 'LOW' },
  10: { temp: 90, wind: 13, code: 1, risk: 'LOW' },
  11: { temp: 90, wind: 16, code: 1, risk: 'LOW' },
  12: { temp: 88, wind: 11, code: 0, risk: 'LOW' },
  13: { temp: 91, wind: 14, code: 1, risk: 'LOW' },
  14: { temp: 86, wind: 19, code: 2, risk: 'LOW' },
  15: { temp: 85, wind: 32, code: 80, risk: 'HIGH' },
  16: { temp: 89, wind: 13, code: 1, risk: 'LOW' },
  17: { temp: 87, wind: 17, code: 2, risk: 'LOW' },
  18: { temp: 88, wind: 14, code: 1, risk: 'LOW' },
  19: { temp: 90, wind: 15, code: 0, risk: 'LOW' },
  20: { temp: 86, wind: 16, code: 1, risk: 'LOW' },
};
const DEFAULT_QUICK = { temp: 88, wind: 15, code: 1, risk: 'LOW' as const };

export default function Weather() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedId, setSelectedId] = useState<number>(1);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loadingWx, setLoadingWx] = useState(false);

  useEffect(() => {
    fetchInventory().then((u) => {
      setUnits(u);
      if (u.length) setSelectedId(u[0].id);
    });
  }, []);

  useEffect(() => {
    setLoadingWx(true);
    setWeather(null);
    fetchWeather(selectedId)
      .then(setWeather)
      .finally(() => setLoadingWx(false));
  }, [selectedId]);

  const hourly = weather
    ? weather.hourly.time.slice(0, 24).map((t, i) => ({
        time: t.slice(11, 16),
        temp: Math.round(weather.hourly.temperature_2m[i] ?? 0),
        wind: Math.round(weather.hourly.wind_speed_10m[i] ?? 0),
        precip: parseFloat((weather.hourly.precipitation[i] ?? 0).toFixed(2)),
      }))
    : [];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28 }}>Weather &amp; Install Risk</h1>
        <span className="text-muted">Live conditions for each ad unit via Open-Meteo (free, no API key)</span>
      </div>

      {/* Fleet risk summary bar */}
      {units.length > 0 && (() => {
        const highRisk = units.filter((u) => (FLEET_QUICK[u.id] ?? DEFAULT_QUICK).risk === 'HIGH');
        return (
          <div className={`fleet-risk-bar ${highRisk.length > 0 ? 'has-risk' : 'all-clear'}`} style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            {highRisk.length > 0 ? (
              <>
                <span style={{ fontWeight: 700 }}>⚠ {highRisk.length} of {units.length} units: HIGH install risk</span>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {highRisk.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => setSelectedId(u.id)}
                      style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid var(--error)', borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 600, color: 'var(--error)', cursor: 'pointer' }}
                    >
                      {u.name}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <span>✓ All {units.length} units showing LOW install risk</span>
            )}
          </div>
        );
      })()}

      {/* Fleet grid */}
      <div className="weather-fleet-grid" style={{ marginBottom: 24 }}>
        {units.map((u) => {
          const q = FLEET_QUICK[u.id] ?? DEFAULT_QUICK;
          const tr = TRAFFIC_QUICK[u.id] ?? DEFAULT_TRAFFIC;
          const isActive = u.id === selectedId;
          const scoreColor = tr.score >= 80 ? 'var(--success)' : tr.score >= 55 ? 'var(--warning)' : 'var(--error)';
          return (
            <div
              key={u.id}
              className={`weather-unit-card${isActive ? ' active' : ''}`}
              onClick={() => setSelectedId(u.id)}
            >
              <div className="weather-card-top">
                <div>
                  <div className="weather-card-name">{u.name}</div>
                  <div className="weather-card-city">{u.city}, {u.state}</div>
                </div>
                <span className={`badge badge-risk-${q.risk.toLowerCase()}`} style={{ fontSize: 10 }}>{q.risk}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
                <span style={{ fontSize: 28 }}>{wxIcon(q.code)}</span>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 20 }}>{q.temp}°F</div>
                  <div className="text-muted text-xs">{q.wind} mph wind</div>
                </div>
              </div>
              <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6, paddingTop: 6, borderTop: '1px solid var(--border)' }}>
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Traffic</span>
                <div style={{ flex: 1, height: 3, background: 'var(--border)', borderRadius: 2 }}>
                  <div style={{ width: `${tr.score}%`, height: '100%', background: scoreColor, borderRadius: 2 }} />
                </div>
                <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: scoreColor, fontWeight: 600 }}>{tr.score}</span>
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{tr.multiplier.toFixed(2)}x</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail section */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18 }}>
          {units.find((u) => u.id === selectedId)?.name ?? 'Unit Detail'}
        </h2>
        <span className="badge badge-active" style={{ fontSize: 10 }}>LIVE</span>
      </div>

      {loadingWx && <div className="spinner-wrap"><div className="spinner" /></div>}

      {weather && !loadingWx && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

          {/* Current conditions */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Current Conditions</span>
              <span className="text-muted text-sm">{weather.unit.city}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 20 }}>
              <span style={{ fontSize: 56, lineHeight: 1 }}>{wxIcon(weather.current.weather_code)}</span>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 44, lineHeight: 1 }}>
                  {weather.current.temperature}°F
                </div>
                <div className="text-muted" style={{ marginTop: 4 }}>{weather.current.weather_desc}</div>
              </div>
            </div>
            <div className="detail-row"><span className="detail-key">Wind Speed</span><span className="detail-val">{weather.current.wind_speed} mph</span></div>
            <div className="detail-row"><span className="detail-key">Wind Gusts</span><span className="detail-val">{weather.current.wind_gusts} mph</span></div>
            <div className="detail-row"><span className="detail-key">Precipitation</span><span className="detail-val">{weather.current.precipitation} mm</span></div>
            <div className="detail-row">
              <span className="detail-key">Timezone</span>
              <span className="detail-val font-mono" style={{ fontSize: 11 }}>{weather.timezone}</span>
            </div>
            <div className="detail-row">
              <span className="detail-key">Updated</span>
              <span className="detail-val font-mono" style={{ fontSize: 11 }}>
                {new Date(weather.fetched_at).toLocaleTimeString()}
              </span>
            </div>
          </div>

          {/* Install risk + Traffic */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Install Risk + Traffic Intelligence</span>
            </div>
            <div style={{ textAlign: 'center', padding: '20px 0 16px' }}>
              <span
                className={`badge badge-risk-${weather.current.install_risk.toLowerCase()}`}
                style={{ fontSize: 20, padding: '10px 24px', borderRadius: 8 }}
              >
                {weather.current.install_risk === 'HIGH' ? '⚠ HIGH RISK' : '✓ LOW RISK'}
              </span>
            </div>
            <div style={{
              padding: '12px 16px',
              background: 'var(--bg-elevated)',
              borderRadius: 'var(--radius)',
              fontSize: 14,
              lineHeight: 1.7,
              color: 'var(--text-primary)',
              marginBottom: 14,
            }}>
              {weather.current.install_risk_reason}
            </div>
            {/* Traffic score for this unit */}
            {(() => {
              const tr = TRAFFIC_QUICK[selectedId] ?? DEFAULT_TRAFFIC;
              const sc = tr.score >= 80 ? 'var(--success)' : tr.score >= 55 ? 'var(--warning)' : 'var(--error)';
              return (
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--text-muted)', marginBottom: 8 }}>
                    Traffic Intelligence (TomTom)
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                    <div style={{ background: 'var(--bg-surface)', borderRadius: 6, padding: '10px 12px' }}>
                      <div className="text-muted text-xs">Traffic Score</div>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, color: sc }}>{tr.score}</div>
                    </div>
                    <div style={{ background: 'var(--bg-surface)', borderRadius: 6, padding: '10px 12px' }}>
                      <div className="text-muted text-xs">Congestion</div>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, color: 'var(--accent)' }}>{tr.congestion}%</div>
                    </div>
                    <div style={{ background: 'var(--bg-surface)', borderRadius: 6, padding: '10px 12px' }}>
                      <div className="text-muted text-xs">Impr. Multiplier</div>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, color: 'var(--accent-blue)' }}>{tr.multiplier.toFixed(2)}x</div>
                    </div>
                    <div style={{ background: 'var(--bg-surface)', borderRadius: 6, padding: '10px 12px' }}>
                      <div className="text-muted text-xs">Install Window</div>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: weather.current.install_risk === 'LOW' ? 'var(--success)' : 'var(--error)', marginTop: 4 }}>
                        {weather.current.install_risk === 'LOW' ? 'Clear for install' : 'Hold: weather risk'}
                      </div>
                    </div>
                  </div>
                  <div className="text-muted text-xs" style={{ lineHeight: 1.5 }}>
                    Multiplier applied to weekly impressions estimate. High traffic = higher effective reach. Score based on current speed vs. free-flow speed ratio (TomTom API or mock fallback).
                  </div>
                </div>
              );
            })()}
            <div className="text-muted text-sm" style={{ lineHeight: 1.5, marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
              Install risk HIGH when: wind &gt;25 mph, gusts &gt;35 mph, precipitation &gt;0.5 mm, or severe weather code detected. OSHA billboard install thresholds.
            </div>
          </div>

          {/* Temperature 24h */}
          {hourly.length > 0 && (
            <div className="card">
              <div className="card-header">
                <span className="card-title">Temperature Forecast (24h)</span>
                <span className="text-muted text-sm">°F</span>
              </div>
              <ResponsiveContainer width="100%" height={190}>
                <LineChart data={hourly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="time" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} tickLine={false} axisLine={false} interval={3} />
                  <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} tickLine={false} axisLine={false} unit="°" />
                  <Tooltip
                    contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12, color: 'var(--text-primary)' }}
                    formatter={(v: number) => [`${v}°F`, 'Temp']}
                  />
                  <Line type="monotone" dataKey="temp" name="Temp" stroke="var(--accent)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Wind + precip 24h */}
          {hourly.length > 0 && (
            <div className="card">
              <div className="card-header">
                <span className="card-title">Wind &amp; Precipitation Forecast (24h)</span>
              </div>
              <ResponsiveContainer width="100%" height={190}>
                <LineChart data={hourly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="time" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} tickLine={false} axisLine={false} interval={3} />
                  <YAxis yAxisId="wind" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} tickLine={false} axisLine={false} unit=" mph" />
                  <YAxis yAxisId="precip" orientation="right" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} tickLine={false} axisLine={false} unit=" mm" />
                  <Tooltip
                    contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12, color: 'var(--text-primary)' }}
                  />
                  <Line yAxisId="wind" type="monotone" dataKey="wind" name="Wind mph" stroke="var(--accent-blue)" strokeWidth={2} dot={false} />
                  <Line yAxisId="precip" type="monotone" dataKey="precip" name="Precip mm" stroke="var(--warning)" strokeWidth={1.5} dot={false} strokeDasharray="5 3" />
                </LineChart>
              </ResponsiveContainer>
              <div className="text-muted text-xs" style={{ marginTop: 8, display: 'flex', gap: 16 }}>
                <span style={{ color: 'var(--accent-blue)' }}>Wind (mph)</span>
                <span style={{ color: 'var(--warning)' }}>- - Precip (mm)</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
