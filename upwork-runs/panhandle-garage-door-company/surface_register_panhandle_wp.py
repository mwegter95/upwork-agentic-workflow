# Register panhandle-wp Docker service with run-server.ps1
# ASCII-only. Idempotent.
# Run via: python scripts/surface_run.py --lang python --file <this file>
import os
import sys
import json
import time
import socket
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
    print("registered '%s' in %s (%d service(s))" % (NAME, f, len(data)))

    # run-server.ps1 launches it within ~10s; wait up to 120s (image pull on first run)
    print("Waiting for Docker to start panhandle-wp on port %d ..." % PORT)
    deadline = time.time() + 120
    while time.time() < deadline:
        if port_open(PORT):
            print("LISTENING on 127.0.0.1:%d" % PORT)
            sys.exit(0)
        time.sleep(3)
    print("NOT_LISTENING on 127.0.0.1:%d after 120s" % PORT)
    print("Check: docker compose -f panhandle_wp/docker-compose.yml logs")
    sys.exit(1)


if __name__ == "__main__":
    main()
