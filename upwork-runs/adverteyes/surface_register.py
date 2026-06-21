#!/usr/bin/env python3
"""Register adverteyes-api as a Surface service."""
import os, sys, json, time, socket
from pathlib import Path

NAME = "adverteyes-api"
CMD  = "node"
ARGS = "dist/index.js"
CWD  = "data/runner-workspace/adverteyes-api"
PORT = 3741

def services_file():
    env = os.environ.get("RUN_SERVICES_FILE")
    if env: return Path(env)
    d = Path.cwd()
    for cand in [d, *d.parents]:
        if (cand / "server.py").exists() and (cand / "runner_blueprint.py").exists():
            return cand / "data" / "services.json"
    if d.name == "runner-workspace": return d.parent / "services.json"
    return d / "services.json"

def port_open(p):
    s = socket.socket(); s.settimeout(0.5)
    try: s.connect(("127.0.0.1", p)); return True
    except: return False
    finally: s.close()

f = services_file()
f.parent.mkdir(parents=True, exist_ok=True)
try:
    data = json.loads(f.read_text()) if f.exists() else []
    if isinstance(data, dict): data = [data]
except: data = []

entry = {"name": NAME, "cmd": CMD, "args": ARGS, "cwd": CWD, "port": PORT}
data = [s for s in data if s.get("name") != NAME] + [entry]
f.write_text(json.dumps(data, indent=2))
print(f"registered '{NAME}' in {f} ({len(data)} service(s))")

deadline = time.time() + 45
while time.time() < deadline:
    if port_open(PORT):
        print(f"LISTENING on 127.0.0.1:{PORT}")
        sys.exit(0)
    time.sleep(2)
print(f"NOT_LISTENING on port {PORT} after 45s - check data/{NAME}.err.log")
sys.exit(1)
