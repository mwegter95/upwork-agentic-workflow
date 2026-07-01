# Check WP container status. ASCII-only.
import subprocess
import socket
import time

def run(cmd, timeout=20):
    r = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
    return r.stdout.strip(), r.stderr.strip(), r.returncode

out, err, rc = run(["docker", "ps", "--filter", "name=panhandle", "--format", "{{.Names}} {{.Status}}"])
print("containers:", out)

# Check port
s = socket.socket()
s.settimeout(1)
try:
    s.connect(("127.0.0.1", 8090))
    print("port 8090: OPEN")
except Exception as e:
    print("port 8090: CLOSED --", e)
finally:
    s.close()

# Try HTTP request to WP
import urllib.request
try:
    req = urllib.request.urlopen("http://127.0.0.1:8090/", timeout=10)
    print("WP HTTP status:", req.status)
    body = req.read(500)
    print("body preview:", body[:200])
except Exception as e:
    print("WP HTTP error:", e)

# WP-CLI: check installed
r = subprocess.run(
    ["docker", "exec", "panhandle-wordpress", "wp", "core", "is-installed", "--allow-root"],
    capture_output=True, text=True, timeout=20
)
print("wp core is-installed rc:", r.returncode, r.stderr[:100])
