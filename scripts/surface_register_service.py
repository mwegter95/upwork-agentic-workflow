#!/usr/bin/env python3
"""
surface_register_service.py — register a long-running service on the Surface so
it is reboot-durable. Copy this, set the CONFIG values, and send it with:

    python scripts/surface_run.py --lang python --file scripts/surface_register_service.py

It writes the service into ../mw-backend/data/services.json. run-server.ps1 (always
running on the Surface) is the SOLE launcher: it starts the service within ~10s,
restarts it if it crashes, and relaunches it on every reboot — no double-start
races, no editing the launcher. After registering, this polls the loopback port
and prints LISTENING. Build the service first (install deps, compile), then
register it. Idempotent: re-running updates the entry by name.
"""
import os
import sys
import json
import time
import socket
from pathlib import Path

# ----------------------------- CONFIG -------------------------------------
NAME = "myfeature-api"                      # unique service name
CMD = "node"                                # executable to launch
ARGS = "server.js"                          # arguments, as a single string
CWD = "data/runner-workspace/myfeature"     # relative to the mw-backend folder, or absolute
PORT = 8787                                 # loopback port the service listens on
# --------------------------------------------------------------------------


def services_file():
    env = os.environ.get("RUN_SERVICES_FILE")
    if env:
        return Path(env)
    d = Path.cwd()
    for cand in [d, *d.parents]:
        if (cand / "server.py").exists() and (cand / "runner_blueprint.py").exists():
            return cand / "data" / "services.json"
    if d.name == "runner-workspace":
        return d.parent / "services.json"
    return d / "services.json"


def port_open(p):
    s = socket.socket()
    s.settimeout(0.5)
    try:
        s.connect(("127.0.0.1", p))
        return True
    except Exception:
        return False
    finally:
        s.close()


def main():
    f = services_file()
    f.parent.mkdir(parents=True, exist_ok=True)
    try:
        data = json.loads(f.read_text()) if f.exists() else []
        if isinstance(data, dict):
            data = [data]
    except Exception:
        data = []

    entry = {"name": NAME, "cmd": CMD, "args": ARGS, "cwd": CWD, "port": PORT}
    data = [s for s in data if s.get("name") != NAME] + [entry]
    f.write_text(json.dumps(data, indent=2))
    print(f"registered '{NAME}' in {f} ({len(data)} service(s))")

    # run-server.ps1 launches it on its next monitor tick (~10s); wait for it.
    deadline = time.time() + 45
    while time.time() < deadline:
        if port_open(PORT):
            print(f"LISTENING on 127.0.0.1:{PORT}")
            sys.exit(0)
        time.sleep(2)
    print(f"NOT_LISTENING on 127.0.0.1:{PORT} after 45s — check data/{NAME}.err.log on the Surface")
    sys.exit(1)


if __name__ == "__main__":
    main()
