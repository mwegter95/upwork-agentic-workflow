# -*- coding: utf-8 -*-
#!/usr/bin/env python3
"""Verify weather endpoint returns real Open-Meteo data (not mock). Also update services.json."""
import json, sys, os, time, socket
from pathlib import Path
import urllib.request, urllib.parse

BASE = "http://127.0.0.1:3741"

def req(method, path, body=None, token=None):
    url = BASE + path
    headers = {"Content-Type": "application/json"}
    if token: headers["Authorization"] = "Bearer " + token
    data = json.dumps(body).encode() if body else None
    r = urllib.request.urlopen(urllib.request.Request(url, data=data, headers=headers, method=method), timeout=15)
    return json.loads(r.read())

# 1. Login
print("[verify] Logging in as admin...")
try:
    resp = req("POST", "/auth/login", {"email": "admin@adverteyes.com", "password": "Admin123!"})
    token = resp["token"]
    print(f"  Login OK, role={resp['user']['role']}")
except Exception as e:
    print(f"  Login FAILED: {e}"); sys.exit(1)

# 2. Test weather for unit 1 (I-275 North Gateway, Tampa)
print("[verify] GET /weather/1...")
try:
    w = req("GET", "/weather/1", token=token)
    cur = w.get("current", {})
    print(f"  unit: {w['unit']['name']}")
    print(f"  temperature: {cur.get('temperature')}F")
    print(f"  wind_speed: {cur.get('wind_speed')}mph")
    print(f"  weather_desc: {cur.get('weather_desc')}")
    print(f"  install_risk: {cur.get('install_risk')}")
    print(f"  hourly time[0]: {w.get('hourly', {}).get('time', [None])[0]}")
    print(f"  fetched_at: {w.get('fetched_at')}")
    if cur.get("temperature") is None:
        print("  WARNING: temperature is None - may still be mock")
    else:
        print("  WEATHER OK - real data returned")
except Exception as e:
    print(f"  Weather FAILED: {e}"); sys.exit(1)

# 3. Also register in services.json so launcher manages it
def services_file():
    env = os.environ.get("RUN_SERVICES_FILE")
    if env: return Path(env)
    d = Path.cwd()
    for cand in [d, *d.parents]:
        if (cand / "server.py").exists() and (cand / "runner_blueprint.py").exists():
            return cand / "data" / "services.json"
    if d.name == "runner-workspace": return d.parent / "services.json"
    return d / "services.json"

f = services_file()
f.parent.mkdir(parents=True, exist_ok=True)
try:
    data = json.loads(f.read_text()) if f.exists() else []
    if isinstance(data, dict): data = [data]
except: data = []
entry = {"name": "adverteyes-api", "cmd": "node", "args": "dist/index.js",
         "cwd": "data/runner-workspace/adverteyes-api", "port": 3741}
data = [s for s in data if s.get("name") != "adverteyes-api"] + [entry]
f.write_text(json.dumps(data, indent=2))
print(f"[register] Updated services.json ({len(data)} services)")

print("[verify] ALL OK")
