import os
import sys
import json
import time
import socket
from pathlib import Path

NAME = "orschell-ecommerce-api"
CMD  = "node"
ARGS = "dist/index.js"
CWD  = "data/runner-workspace/orschell-ecommerce"
PORT = 3742


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

    deadline = time.time() + 45
    while time.time() < deadline:
        if port_open(PORT):
            print(f"LISTENING on 127.0.0.1:{PORT}")
            sys.exit(0)
        time.sleep(2)
    print(f"NOT_LISTENING on 127.0.0.1:{PORT} after 45s")
    sys.exit(1)


if __name__ == "__main__":
    main()
