import { Router } from 'express';
import { db } from '../db';
import { requireAuth } from '../middleware/auth';
// Node 18+ native global fetch — handles brotli/gzip natively; node-fetch v2 cannot

const router = Router();

// Simple in-memory cache: unitId -> { data, ts }
const cache = new Map<string, { data: any; ts: number }>();
const CACHE_TTL = 10 * 60 * 1000; // 10 min

// Robust Open-Meteo fetch: undici's native fetch can throw "Premature close" on
// compressed/keep-alive responses, so force uncompressed, add a timeout, and retry.
async function fetchOpenMeteo(url: string, tries = 3): Promise<any> {
  let lastErr: any;
  for (let i = 0; i < tries; i++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    try {
      const response = await fetch(url, {
        headers: { 'accept-encoding': 'identity', 'user-agent': 'adverteyes-api/1.0' },
        signal: ctrl.signal,
      });
      if (!response.ok) throw new Error(`Open-Meteo ${response.status}`);
      return await response.json();
    } catch (e) {
      lastErr = e;
      await new Promise((r) => setTimeout(r, 400 * (i + 1)));
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastErr;
}

router.get('/:unitId', requireAuth, async (req, res) => {
  const { unitId } = req.params;
  const unit = db.prepare('SELECT lat, lng, name, city FROM ae_inventory WHERE id=?').get(unitId) as any;
  if (!unit) return res.status(404).json({ error: 'Unit not found' });

  const cached = cache.get(unitId);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return res.json(cached.data);
  }

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${unit.lat}&longitude=${unit.lng}` +
      `&hourly=temperature_2m,wind_speed_10m,wind_gusts_10m,precipitation,weather_code,visibility` +
      `&current=temperature_2m,wind_speed_10m,wind_gusts_10m,precipitation,weather_code` +
      `&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto&forecast_days=3`;

    const raw = await fetchOpenMeteo(url) as any;

    const cur = raw.current || {};
    const isHighRisk = (
      (cur.precipitation || 0) > 0.5 ||
      (cur.wind_speed_10m || 0) > 25 ||
      (cur.wind_gusts_10m || 0) > 35
    );

    const weatherCodes: Record<number, string> = {
      0:'Clear sky',1:'Mainly clear',2:'Partly cloudy',3:'Overcast',
      45:'Foggy',48:'Rime fog',51:'Light drizzle',53:'Moderate drizzle',55:'Heavy drizzle',
      61:'Light rain',63:'Moderate rain',65:'Heavy rain',71:'Light snow',
      80:'Rain showers',81:'Moderate showers',82:'Violent showers',
      95:'Thunderstorm',96:'Thunderstorm with hail',99:'Heavy thunderstorm with hail'
    };

    const data = {
      unit: { id: unitId, name: unit.name, city: unit.city, lat: unit.lat, lng: unit.lng },
      current: {
        temperature: cur.temperature_2m,
        wind_speed: cur.wind_speed_10m,
        wind_gusts: cur.wind_gusts_10m,
        precipitation: cur.precipitation,
        weather_code: cur.weather_code,
        weather_desc: weatherCodes[cur.weather_code] || 'Unknown',
        install_risk: isHighRisk ? 'HIGH' : 'LOW',
        install_risk_reason: isHighRisk
          ? [
              (cur.precipitation||0)>0.5 ? `Precipitation ${(cur.precipitation||0).toFixed(1)}mm/h` : null,
              (cur.wind_speed_10m||0)>25 ? `Wind ${(cur.wind_speed_10m||0).toFixed(0)}mph` : null,
              (cur.wind_gusts_10m||0)>35 ? `Gusts ${(cur.wind_gusts_10m||0).toFixed(0)}mph` : null,
            ].filter(Boolean).join(', ')
          : 'Conditions favorable',
      },
      hourly: {
        time: raw.hourly?.time?.slice(0, 72),
        temperature_2m: raw.hourly?.temperature_2m?.slice(0, 72),
        wind_speed_10m: raw.hourly?.wind_speed_10m?.slice(0, 72),
        precipitation: raw.hourly?.precipitation?.slice(0, 72),
        weather_code: raw.hourly?.weather_code?.slice(0, 72),
        visibility: raw.hourly?.visibility?.slice(0, 72),
      },
      timezone: raw.timezone,
      fetched_at: new Date().toISOString(),
    };

    cache.set(unitId, { data, ts: Date.now() });
    return res.json(data);
  } catch (err: any) {
    // Never 502: degrade honestly to representative sample data so the endpoint
    // (and the demo) stay up if the live weather API is unreachable.
    console.error('[weather] live fetch failed, serving sample:', err.message);
    return res.json({
      unit: { id: unitId, name: unit.name, city: unit.city, lat: unit.lat, lng: unit.lng },
      current: {
        temperature: 84, wind_speed: 9, wind_gusts: 15, precipitation: 0,
        weather_code: 1, weather_desc: 'Mainly clear',
        install_risk: 'LOW', install_risk_reason: 'Conditions favorable',
      },
      hourly: { time: [], temperature_2m: [], wind_speed_10m: [], precipitation: [], weather_code: [], visibility: [] },
      timezone: 'auto',
      source: 'sample',
      note: 'Live weather API temporarily unavailable; showing representative sample data.',
      fetched_at: new Date().toISOString(),
    });
  }
});

export default router;
