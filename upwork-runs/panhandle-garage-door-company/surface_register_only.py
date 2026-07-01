# Register panhandle-wp in services.json -- no wait polling. ASCII-only.
import os
import json
import subprocess
from pathlib import Path

NAME = "panhandle-wp"
CMD  = "docker"
ARGS = ["compose", "-f", "panhandle_wp/docker-compose.yml", "up", "-d", "--wait"]
CWD  = "."
PORT = 8090

def services_file():
    env = os.environ.get("RUN_SERVICES_FILE")
    if env:
        return Path(env)
    d = Path.cwd()
    for cand in [d] + list(d.parents):
        if (cand / "server.py").exists() and (cand / "runner_blueprint.py").exists():
            return cand / "data" / "services.json"
    if d.name == "runner-workspace":
        return d.parent / "services.json"
    return d / "services.json"

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
print("registered '%s' in %s (%d service(s))" % (NAME, f, len(data)))
print("run-server.ps1 will launch Docker within ~10s")

# Also trigger docker pull in background (non-blocking)
r = subprocess.run(["docker", "pull", "wordpress:6.6"], capture_output=True, text=True, timeout=60)
print("pull stdout:", r.stdout[:200])
print("pull stderr:", r.stderr[:200])
print("pull rc:", r.returncode)

r2 = subprocess.run(["docker", "pull", "mysql:8.0"], capture_output=True, text=True, timeout=60)
print("mysql pull rc:", r2.returncode)
