#!/usr/bin/env python3
"""
Minimal repair: patch weather.ts + traffic.ts to native fetch, rebuild, restart service.
Run via: python scripts/surface_run.py --lang python --file upwork-runs/adverteyes/surface_weather_rebuild4.py
"""
import subprocess, sys, os, time, socket, json
from pathlib import Path

WORKSPACE = Path("adverteyes-api")
ROUTES = WORKSPACE / "src" / "routes"
NODE_DIR = r"C:\Program Files\nodejs"
NPM = NODE_DIR + r"\npm.cmd"
NODE = NODE_DIR + r"\node.exe"
_env = {**os.environ, "PATH": NODE_DIR + ";" + os.environ.get("PATH", "")}
PORT = 3741

def w(path, content):
    Path(path).write_text(content, encoding="utf-8")
    print("  wrote " + str(path))

def port_open(p):
    s = socket.socket(); s.settimeout(0.5)
    try: s.connect(("127.0.0.1", p)); return True
    except: return False
    finally: s.close()

# Fix 1: weather.ts — native fetch, no node-fetch import
WEATHER_TS = """import { Router } from 'express';
import { db } from '../db';
import { requireAuth } from '../middleware/auth';
// Node 18+ native global fetch — handles brotli/gzip; node-fetch v2 cannot

const router = Router();
const cache = new Map<string, { data: any; ts: number }>();
const CACHE_TTL = 10 * 60 * 1000;

const CODES: Record<number, string> = {
  0:'Clear sky',1:'Mainly clear',2:'Partly cloudy',3:'Overcast',
  45:'Foggy',48:'Rime fog',51:'Light drizzle',53:'Moderate drizzle',55:'Heavy drizzle',
  61:'Light rain',63:'Moderate rain',65:'Heavy rain',71:'Light snow',
  80:'Rain showers',81:'Moderate showers',82:'Violent showers',
  95:'Thunderstorm',96:'Thunderstorm with hail',99:'Heavy thunderstorm with hail'
};

router.get('/:unitId', requireAuth, async (req, res) => {
  const { unitId } = req.params;
  const unit = db.prepare('SELECT lat, lng, name, city FROM ae_inventory WHERE id=?').get(unitId) as any;
  if (!unit) return res.status(404).json({ error: 'Unit not found' });

  const cached = cache.get(unitId);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return res.json(cached.data);

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${unit.lat}&longitude=${unit.lng}`
      + `&hourly=temperature_2m,wind_speed_10m,wind_gusts_10m,precipitation,weather_code,visibility`
      + `&current=temperature_2m,wind_speed_10m,wind_gusts_10m,precipitation,weather_code`
      + `&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto&forecast_days=3`;

    const response = await fetch(url);
    if (!response.ok) throw new Error(`Open-Meteo ${response.status}`);
    const raw = await response.json() as any;

    const cur = raw.current || {};
    const isHigh = (cur.precipitation||0)>0.5 || (cur.wind_speed_10m||0)>25 || (cur.wind_gusts_10m||0)>35;

    const data = {
      unit: { id: unitId, name: unit.name, city: unit.city, lat: unit.lat, lng: unit.lng },
      current: {
        temperature: cur.temperature_2m,
        wind_speed: cur.wind_speed_10m,
        wind_gusts: cur.wind_gusts_10m,
        precipitation: cur.precipitation,
        weather_code: cur.weather_code,
        weather_desc: CODES[cur.weather_code] || 'Unknown',
        install_risk: isHigh ? 'HIGH' : 'LOW',
        install_risk_reason: isHigh
          ? [(cur.precipitation||0)>0.5?`Precipitation ${(cur.precipitation||0).toFixed(1)}mm/h`:null,
             (cur.wind_speed_10m||0)>25?`Wind ${(cur.wind_speed_10m||0).toFixed(0)}mph`:null,
             (cur.wind_gusts_10m||0)>35?`Gusts ${(cur.wind_gusts_10m||0).toFixed(0)}mph`:null
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
    console.error('[weather] fetch failed:', err.message);
    return res.status(502).json({ error: 'Weather data unavailable', detail: err.message });
  }
});

export default router;
"""

# Fix 2: traffic.ts — native fetch
TRAFFIC_TS = """import { Router } from 'express';
import { db } from '../db';
import { requireAuth } from '../middleware/auth';
// Node 18+ native global fetch

const router = Router();
const cache = new Map<string, { data: any; ts: number }>();
const TTL = 15 * 60 * 1000;
const KEY = process.env.TOMTOM_API_KEY || '';

function mock(unitId: string, lat: number, lng: number) {
  const seed = Math.abs(lat * 1000 + lng * 100 + Number(unitId) * 7) % 100;
  const ff = 45 + (seed % 20); const cong = 15 + (seed % 50); const cs = Math.round(ff * (1 - cong / 100));
  return { currentSpeed: cs, freeFlowSpeed: ff, congestionPct: cong, confidence: 0.85, roadClosure: false,
           trafficScore: Math.max(10, 100 - cong), impression_multiplier: (1 + cong / 200).toFixed(2), source: 'mock' };
}

router.get('/:unitId', requireAuth, async (req, res) => {
  const { unitId } = req.params;
  const unit = db.prepare('SELECT lat, lng, name FROM ae_inventory WHERE id=?').get(unitId) as any;
  if (!unit) return res.status(404).json({ error: 'Unit not found' });

  const cached = cache.get(unitId);
  if (cached && Date.now() - cached.ts < TTL) return res.json({ ...cached.data, unit: { id: unitId, name: unit.name } });

  if (!KEY) {
    const m = mock(unitId, unit.lat, unit.lng);
    return res.json({ ...m, unit: { id: unitId, name: unit.name } });
  }

  try {
    const url = `https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json?point=${unit.lat},${unit.lng}&key=${KEY}`;
    const r = await fetch(url);
    if (!r.ok) throw new Error(`TomTom ${r.status}`);
    const raw = await r.json() as any;
    const fd = raw.flowSegmentData;
    const cong = Math.round((1 - fd.currentSpeed / fd.freeFlowSpeed) * 100);
    const data = {
      currentSpeed: fd.currentSpeed, freeFlowSpeed: fd.freeFlowSpeed,
      congestionPct: Math.max(0, cong), confidence: fd.confidence,
      roadClosure: fd.roadClosure, trafficScore: Math.max(10, 100 - cong),
      impression_multiplier: (1 + cong / 200).toFixed(2), source: 'tomtom',
    };
    cache.set(unitId, { data, ts: Date.now() });
    return res.json({ ...data, unit: { id: unitId, name: unit.name } });
  } catch (err: any) {
    const m = mock(unitId, unit.lat, unit.lng);
    return res.json({ ...m, unit: { id: unitId, name: unit.name } });
  }
});

router.get('/', requireAuth, async (req, res) => {
  const units = db.prepare('SELECT id, lat, lng, name FROM ae_inventory').all() as any[];
  const traffic = units.map(u => {
    const m = mock(String(u.id), u.lat, u.lng);
    return { id: u.id, name: u.name, ...m };
  });
  return res.json({ traffic });
});

export default router;
"""

w(ROUTES / "weather.ts", WEATHER_TS)
w(ROUTES / "traffic.ts", TRAFFIC_TS)

# Rebuild
print("[rebuild] Running tsc...")
r = subprocess.run([NPM, "run", "build"], cwd=str(WORKSPACE), capture_output=True, text=True, env=_env)
print("STDOUT:", r.stdout[-2000:])
if r.returncode != 0:
    print("STDERR:", r.stderr[-3000:])
    print("[build] FAILED"); sys.exit(1)
print("[build] Success")

# Restart: kill existing on port 3741
r2 = subprocess.run("netstat -ano", capture_output=True, text=True, shell=True)
killed = False
for line in r2.stdout.splitlines():
    if ":3741" in line and "LISTENING" in line:
        pid = line.split()[-1]
        subprocess.run(f"taskkill /F /PID {pid}", capture_output=True, shell=True)
        print(f"[restart] Killed PID {pid}")
        killed = True
        break

if not killed:
    print("[restart] No existing process on 3741")

time.sleep(2)

# Start new process
DATA = Path("data")
DATA.mkdir(exist_ok=True)
OUT_LOG = DATA / "adverteyes-api.out.log"
ERR_LOG = DATA / "adverteyes-api.err.log"
proc = subprocess.Popen(
    [NODE, "dist/index.js"],
    cwd=str(WORKSPACE),
    stdout=open(str(OUT_LOG), "w"),
    stderr=open(str(ERR_LOG), "w"),
    env=_env,
    creationflags=getattr(subprocess, 'DETACHED_PROCESS', 8) | getattr(subprocess, 'CREATE_NEW_PROCESS_GROUP', 512)
)
print(f"[start] PID {proc.pid}")

deadline = time.time() + 25
while time.time() < deadline:
    time.sleep(2)
    if port_open(PORT):
        print(f"LISTENING on 127.0.0.1:{PORT}")
        # Quick weather verify
        import urllib.request
        try:
            # Need auth token — just check health
            health = urllib.request.urlopen(f"http://127.0.0.1:{PORT}/health", timeout=5)
            body = json.loads(health.read())
            print(f"[health] {body}")
        except Exception as e:
            print(f"[health] {e}")
        sys.exit(0)

for lf in [OUT_LOG, ERR_LOG]:
    if Path(lf).exists():
        print(f"=== {lf.name} ==="); print(Path(lf).read_text(errors='replace')[-1500:])
print("NOT_LISTENING after 25s"); sys.exit(1)
