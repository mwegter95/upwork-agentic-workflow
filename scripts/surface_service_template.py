#!/usr/bin/env python3
"""
surface_service_template.py — start a LONG-RUNNING service on the Surface so it
stays up after the runner call returns. Copy this, set the four CONFIG values,
and send it with:

    python scripts/surface_run.py --lang python --file scripts/surface_service_template.py

WHY THIS EXISTS
  The runner executes your script with subprocess.run(), i.e. it WAITS for the
  script to exit. If you just run `node server.js` it blocks until timeout and is
  then killed — the service never persists. This template instead spawns the
  service DETACHED (its own session / process group), redirects its output to a
  log file so it does NOT inherit the runner's captured pipes (which would hang
  the call), health-checks it, prints the PID, and exits. The detached service
  keeps running. Works on Windows (the Surface) and POSIX.

  Build first (npm install, etc.) in the SAME runner working directory, then call
  this to start it. By default the runner runs scripts in its workspace dir, so a
  relative CWD below resolves there — no absolute Surface path needed.
"""
import os
import sys
import time
import socket
import subprocess

# ----------------------------- CONFIG -------------------------------------
CMD = ["node", "server.js"]   # how to start the service (argv list)
CWD = "."                     # dir to run it in (relative to the runner workspace, or absolute)
PORT = 8787                   # the loopback port the service listens on
HEALTH_PATH = "/health"       # GET path to confirm it is up ("" = just check the port is open)
# --------------------------------------------------------------------------


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
    cwd = os.path.abspath(CWD)
    os.makedirs(cwd, exist_ok=True)
    log_path = os.path.join(cwd, "service.log")
    logf = open(log_path, "ab")

    kwargs = dict(cwd=cwd, stdout=logf, stderr=logf, stdin=subprocess.DEVNULL, close_fds=True)
    if os.name == "nt":
        # DETACHED_PROCESS | CREATE_NEW_PROCESS_GROUP -> survives this script exiting
        kwargs["creationflags"] = 0x00000008 | 0x00000200
    else:
        kwargs["start_new_session"] = True

    try:
        proc = subprocess.Popen(CMD, **kwargs)
    except Exception as e:
        print(f"FAILED to launch {CMD}: {e}")
        sys.exit(1)
    print(f"started pid {proc.pid}; logging to {log_path}")

    # Wait for the port to come up (or the process to die early).
    ok = False
    deadline = time.time() + 30
    while time.time() < deadline:
        if port_open(PORT):
            ok = True
            break
        if proc.poll() is not None:
            print(f"service EXITED early with code {proc.returncode}; see {log_path}")
            sys.exit(1)
        time.sleep(1)

    if ok and HEALTH_PATH:
        import urllib.request
        try:
            with urllib.request.urlopen(f"http://127.0.0.1:{PORT}{HEALTH_PATH}", timeout=5) as r:
                print(f"health {r.status}")
                ok = r.status < 500
        except Exception as e:
            print(f"health check failed: {e}")
            ok = False

    print(("LISTENING" if ok else "NOT_LISTENING") + f" on 127.0.0.1:{PORT}")
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
