# Start panhandle Docker containers using cached image. ASCII-only.
import subprocess
import os
import json
import socket
import time
from pathlib import Path

WORKSPACE = Path("panhandle_wp")

# Update docker-compose.yml to use cached image (wordpress:php8.2-apache)
compose = """services:
  wordpress:
    image: wordpress:php8.2-apache
    container_name: panhandle-wordpress
    depends_on: [db]
    ports: ["8090:80"]
    restart: always
    environment:
      WORDPRESS_DB_HOST: db
      WORDPRESS_DB_NAME: panhandle
      WORDPRESS_DB_USER: wp
      WORDPRESS_DB_PASSWORD: panhandle_wp_2026
      WORDPRESS_TABLE_PREFIX: ph_
    volumes:
      - panhandle_wp_data:/var/www/html
      - ./panhandle-theme:/var/www/html/wp-content/themes/panhandle-theme
  db:
    image: mysql:8.0
    container_name: panhandle-mysql
    restart: always
    environment:
      MYSQL_DATABASE: panhandle
      MYSQL_USER: wp
      MYSQL_PASSWORD: panhandle_wp_2026
      MYSQL_ROOT_PASSWORD: panhandle_root_2026
    volumes:
      - panhandle_db:/var/lib/mysql
volumes:
  panhandle_wp_data:
  panhandle_db:
"""
(WORKSPACE / "docker-compose.yml").write_text(compose)
print("docker-compose.yml updated to use wordpress:php8.2-apache")

# Start containers (no --wait to avoid blocking)
r = subprocess.run(
    ["docker", "compose", "-f", str(WORKSPACE / "docker-compose.yml"), "up", "-d"],
    capture_output=True, text=True, timeout=60
)
print("compose up stdout:", r.stdout.strip()[:500])
print("compose up stderr:", r.stderr.strip()[:500])
print("compose up rc:", r.returncode)

# Update services.json with correct image command
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
try:
    data = json.loads(f.read_text()) if f.exists() else []
    if isinstance(data, dict):
        data = [data]
except Exception:
    data = []

entry = {"name": "panhandle-wp", "cmd": "docker",
         "args": ["compose", "-f", "panhandle_wp/docker-compose.yml", "up", "-d"],
         "cwd": ".", "port": 8090}
data = [s for s in data if s.get("name") != "panhandle-wp"] + [entry]
f.write_text(json.dumps(data, indent=2))
print("services.json updated")

# Poll for port 8090 (up to 60s)
print("Polling port 8090...")
deadline = time.time() + 60
while time.time() < deadline:
    s = socket.socket()
    s.settimeout(0.5)
    try:
        s.connect(("127.0.0.1", 8090))
        s.close()
        print("LISTENING on 8090")
        break
    except Exception:
        s.close()
        time.sleep(3)
else:
    print("NOT_LISTENING on 8090 after 60s -- containers may still be starting")

# Show container status
r2 = subprocess.run(
    ["docker", "ps", "--filter", "name=panhandle", "--format", "{{.Names}} {{.Status}}"],
    capture_output=True, text=True
)
print("container status:", r2.stdout.strip())
