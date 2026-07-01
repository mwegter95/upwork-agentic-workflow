# Diagnostics -- check docker status. ASCII-only.
import subprocess

def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
    return r.stdout.strip(), r.stderr.strip(), r.returncode

# Check docker is available
out, err, rc = run(["docker", "--version"])
print("docker version:", out, err, "rc=%d" % rc)

# Check running containers
out, err, rc = run(["docker", "ps", "-a", "--format", "table {{.Names}}\t{{.Status}}\t{{.Ports}}"])
print("containers:", out or "(none)")

# Check if panhandle-wordpress exists
out, err, rc = run(["docker", "ps", "-a", "--filter", "name=panhandle", "--format", "{{.Names}} {{.Status}}"])
print("panhandle containers:", out or "(none)")

# Check available images
out, err, rc = run(["docker", "images", "--format", "{{.Repository}}:{{.Tag}}\t{{.Size}}"])
print("images:", out or "(none)")

# Check port 8090
import socket
s = socket.socket()
s.settimeout(1)
try:
    s.connect(("127.0.0.1", 8090))
    print("port 8090: OPEN")
except Exception as e:
    print("port 8090: CLOSED (%s)" % e)
finally:
    s.close()
