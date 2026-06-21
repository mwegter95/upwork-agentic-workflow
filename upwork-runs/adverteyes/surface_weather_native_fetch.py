# -*- coding: utf-8 -*-
#!/usr/bin/env python3
"""
Switch weather route from node-fetch to Node 24 native global fetch.
Native fetch handles brotli/gzip natively; node-fetch v2 cannot.
Also rebuild.
"""
import subprocess, sys, os, time, socket
from pathlib import Path

WORKSPACE = Path("adverteyes-api")
ROUTES = WORKSPACE / "src" / "routes"
NPM  = r"C:\Program Files\nodejs\npm.cmd"
NODE = r"C:\Program Files\nodejs\node.exe"
NODE_DIR = r"C:\Program Files\nodejs"
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

# weather.ts using native fetch (no node-fetch import)
WEATHER_TS = (
    "import { Router } from 'express';\n"
    "import { db } from '../db';\n"
    "import { requireAuth } from '../middleware/auth';\n"
    "// Use Node 24 native global fetch - handles brotli/gzip natively\n"
    "// node-fetch v2 fails with Open-Meteo's compressed responses\n"
    "\n"
    "const router = Router();\n"
    "const cache = new Map<string, { data: any; ts: number }>();\n"
    "const CACHE_TTL = 10 * 60 * 1000;\n"
    "\n"
    "router.get('/:unitId', requireAuth, async (req, res) => {\n"
    "  const { unitId } = req.params;\n"
    "  const unit = db.prepare('SELECT lat, lng, name, city FROM ae_inventory WHERE id=?').get(unitId) as any;\n"
    "  if (!unit) return res.status(404).json({ error: 'Unit not found' });\n"
    "\n"
    "  const cached = cache.get(unitId);\n"
    "  if (cached && Date.now() - cached.ts < CACHE_TTL) return res.json(cached.data);\n"
    "\n"
    "  try {\n"
    "    const url = `https://api.open-meteo.com/v1/forecast?latitude=${unit.lat}&longitude=${unit.lng}`\n"
    "      + `&hourly=temperature_2m,wind_speed_10m,wind_gusts_10m,precipitation,weather_code,visibility`\n"
    "      + `&current=temperature_2m,wind_speed_10m,wind_gusts_10m,precipitation,weather_code`\n"
    "      + `&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto&forecast_days=3`;\n"
    "\n"
    "    // Native fetch (Node 24 built-in) handles all encodings including brotli\n"
    "    const response = await fetch(url);\n"
    "    if (!response.ok) throw new Error(`Open-Meteo ${response.status}`);\n"
    "    const raw = await response.json() as any;\n"
    "\n"
    "    const cur = raw.current || {};\n"
    "    const isHighRisk = (\n"
    "      (cur.precipitation || 0) > 0.5 ||\n"
    "      (cur.wind_speed_10m || 0) > 25 ||\n"
    "      (cur.wind_gusts_10m || 0) > 35\n"
    "    );\n"
    "\n"
    "    const weatherCodes: Record<number, string> = {\n"
    "      0:'Clear sky',1:'Mainly clear',2:'Partly cloudy',3:'Overcast',\n"
    "      45:'Foggy',48:'Rime fog',51:'Light drizzle',53:'Moderate drizzle',55:'Heavy drizzle',\n"
    "      61:'Light rain',63:'Moderate rain',65:'Heavy rain',71:'Light snow',\n"
    "      80:'Rain showers',81:'Moderate showers',82:'Violent showers',\n"
    "      95:'Thunderstorm',96:'Thunderstorm with hail',99:'Heavy thunderstorm with hail'\n"
    "    };\n"
    "\n"
    "    const data = {\n"
    "      unit: { id: unitId, name: unit.name, city: unit.city, lat: unit.lat, lng: unit.lng },\n"
    "      current: {\n"
    "        temperature: cur.temperature_2m,\n"
    "        wind_speed: cur.wind_speed_10m,\n"
    "        wind_gusts: cur.wind_gusts_10m,\n"
    "        precipitation: cur.precipitation,\n"
    "        weather_code: cur.weather_code,\n"
    "        weather_desc: weatherCodes[cur.weather_code] || 'Unknown',\n"
    "        install_risk: isHighRisk ? 'HIGH' : 'LOW',\n"
    "        install_risk_reason: isHighRisk\n"
    "          ? [\n"
    "              (cur.precipitation||0)>0.5 ? `Precipitation ${(cur.precipitation||0).toFixed(1)}mm/h` : null,\n"
    "              (cur.wind_speed_10m||0)>25 ? `Wind ${(cur.wind_speed_10m||0).toFixed(0)}mph` : null,\n"
    "              (cur.wind_gusts_10m||0)>35 ? `Gusts ${(cur.wind_gusts_10m||0).toFixed(0)}mph` : null,\n"
    "            ].filter(Boolean).join(', ')\n"
    "          : 'Conditions favorable',\n"
    "      },\n"
    "      hourly: {\n"
    "        time: raw.hourly?.time?.slice(0, 72),\n"
    "        temperature_2m: raw.hourly?.temperature_2m?.slice(0, 72),\n"
    "        wind_speed_10m: raw.hourly?.wind_speed_10m?.slice(0, 72),\n"
    "        precipitation: raw.hourly?.precipitation?.slice(0, 72),\n"
    "        weather_code: raw.hourly?.weather_code?.slice(0, 72),\n"
    "        visibility: raw.hourly?.visibility?.slice(0, 72),\n"
    "      },\n"
    "      timezone: raw.timezone,\n"
    "      fetched_at: new Date().toISOString(),\n"
    "    };\n"
    "\n"
    "    cache.set(unitId, { data, ts: Date.now() });\n"
    "    return res.json(data);\n"
    "  } catch (err: any) {\n"
    "    console.error('[weather] fetch failed:', err.message);\n"
    "    return res.status(502).json({ error: 'Weather data unavailable', detail: err.message });\n"
    "  }\n"
    "});\n"
    "\n"
    "export default router;\n"
)
w(ROUTES / "weather.ts", WEATHER_TS)

# Rebuild
print("[patch] Rebuilding...")
r = subprocess.run([NPM, "run", "build"], cwd=str(WORKSPACE), capture_output=True, text=True, env=_env)
print("STDOUT:", r.stdout[-1000:])
if r.returncode != 0:
    print("STDERR:", r.stderr[-2000:]); print("[build] FAILED"); sys.exit(1)
print("[build] Success")

# Kill existing on 3741
r2 = subprocess.run(["netstat", "-ano"], capture_output=True, text=True, shell=True)
for line in r2.stdout.splitlines():
    if ":3741" in line and "LISTENING" in line:
        pid = line.split()[-1]
        subprocess.run(["taskkill", "/F", "/PID", pid], capture_output=True, shell=True)
        print(f"[restart] Killed PID {pid}")
        break
time.sleep(2)

# Start new instance
OUT_LOG = Path("data") / "adverteyes-api.out.log"
ERR_LOG = Path("data") / "adverteyes-api.err.log"
Path("data").mkdir(exist_ok=True)
proc = subprocess.Popen(
    [NODE, "dist/index.js"],
    cwd=str(WORKSPACE),
    stdout=open(str(OUT_LOG), "w"),
    stderr=open(str(ERR_LOG), "w"),
    env=_env,
    creationflags=subprocess.DETACHED_PROCESS | subprocess.CREATE_NEW_PROCESS_GROUP
)
print(f"[start] Launched PID {proc.pid}")

deadline = time.time() + 20
while time.time() < deadline:
    time.sleep(2)
    if port_open(PORT):
        print(f"LISTENING on 127.0.0.1:{PORT}")
        sys.exit(0)

for lf in [OUT_LOG, ERR_LOG]:
    if lf.exists():
        txt = lf.read_text(errors="replace")
        print(f"=== {lf.name} ==="); print(txt[-1000:])
print("NOT_LISTENING after 20s"); sys.exit(1)
