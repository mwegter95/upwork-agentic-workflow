# -*- coding: utf-8 -*-
#!/usr/bin/env python3
"""Kill the node process on port 3741 so run-server.ps1 relaunches it with new dist/."""
import subprocess, sys, time, socket, os

PORT = 3741
NAME = "adverteyes-api"

def port_open(p):
    s = socket.socket(); s.settimeout(0.5)
    try: s.connect(("127.0.0.1", p)); return True
    except: return False
    finally: s.close()

# Find and kill the process on port 3741
print(f"[restart] Finding process on port {PORT}...")
r = subprocess.run(
    ["netstat", "-ano"],
    capture_output=True, text=True, shell=True
)
pid = None
for line in r.stdout.splitlines():
    if f":{PORT}" in line and "LISTENING" in line:
        parts = line.split()
        pid = parts[-1]
        break

if pid:
    print(f"[restart] Killing PID {pid}...")
    subprocess.run(["taskkill", "/F", "/PID", pid], capture_output=True, shell=True)
    print(f"[restart] Killed PID {pid}")
else:
    print("[restart] No process found on port - it may already be down")

# Wait for run-server.ps1 to restart it (up to 30s)
print(f"[restart] Waiting for service to come back on port {PORT}...")
deadline = time.time() + 30
while time.time() < deadline:
    time.sleep(2)
    if port_open(PORT):
        print(f"[restart] LISTENING on 127.0.0.1:{PORT}")
        sys.exit(0)

print(f"[restart] NOT_LISTENING after 30s")
sys.exit(1)
