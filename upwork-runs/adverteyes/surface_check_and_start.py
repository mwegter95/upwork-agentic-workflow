# -*- coding: utf-8 -*-
#!/usr/bin/env python3
"""Check error log, manually start service, confirm LISTENING."""
import subprocess, sys, time, socket, os, json
from pathlib import Path

PORT = 3741
WORKSPACE = Path("adverteyes-api")
ERR_LOG = Path("data") / "adverteyes-api.err.log"
OUT_LOG = Path("data") / "adverteyes-api.out.log"
NODE = r"C:\Program Files\nodejs\node.exe"

def port_open(p):
    s = socket.socket(); s.settimeout(0.5)
    try: s.connect(("127.0.0.1", p)); return True
    except: return False
    finally: s.close()

# Print error log
if ERR_LOG.exists():
    txt = ERR_LOG.read_text(errors="replace")
    print("=== err.log (last 2000 chars) ===")
    print(txt[-2000:])
else:
    print("No err.log found at", ERR_LOG)

if OUT_LOG.exists():
    txt = OUT_LOG.read_text(errors="replace")
    print("=== out.log (last 1000 chars) ===")
    print(txt[-1000:])

# Check if port already open
if port_open(PORT):
    print(f"Already LISTENING on {PORT}")
    sys.exit(0)

# Try to start manually using Popen (detached)
print("[start] Starting adverteyes-api manually...")
DEVNULL = open(os.devnull, 'w')

# Use start /B on Windows to detach
result = subprocess.Popen(
    [NODE, "dist/index.js"],
    cwd=str(WORKSPACE),
    stdout=open(str(OUT_LOG), "a"),
    stderr=open(str(ERR_LOG), "a"),
    creationflags=subprocess.DETACHED_PROCESS | subprocess.CREATE_NEW_PROCESS_GROUP
)
print(f"[start] Launched PID {result.pid}")

deadline = time.time() + 20
while time.time() < deadline:
    time.sleep(2)
    if port_open(PORT):
        print(f"LISTENING on 127.0.0.1:{PORT}")
        sys.exit(0)

# Print any new errors
if ERR_LOG.exists():
    txt = ERR_LOG.read_text(errors="replace")
    print("=== err.log after start attempt ===")
    print(txt[-2000:])

print(f"NOT_LISTENING after 20s")
sys.exit(1)
