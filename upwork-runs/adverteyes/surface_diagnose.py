# -*- coding: utf-8 -*-
#!/usr/bin/env python3
"""Diagnose why adverteyes-api won't start: run node directly and capture output."""
import subprocess, sys, os
from pathlib import Path

WORKSPACE = Path("adverteyes-api")
NODE = r"C:\Program Files\nodejs\node.exe"
NODE_DIR = r"C:\Program Files\nodejs"
_env = {**os.environ, "PATH": NODE_DIR + ";" + os.environ.get("PATH", "")}

# Check dist exists
dist_main = WORKSPACE / "dist" / "index.js"
print(f"dist/index.js exists: {dist_main.exists()}")
if dist_main.exists():
    content = dist_main.read_text(encoding="utf-8", errors="replace")
    print(f"dist/index.js size: {len(content)} chars")

# Check .env
env_file = WORKSPACE / ".env"
print(f".env exists: {env_file.exists()}")
if env_file.exists():
    # Show non-secret parts
    for line in env_file.read_text(encoding="utf-8", errors="replace").splitlines():
        if "SECRET" not in line.upper() and "KEY" not in line.upper():
            print("  .env:", line)
        else:
            key = line.split("=")[0] if "=" in line else line
            print(f"  .env: {key}=***")

# Run node briefly to see startup error
print("\n[diag] Running node dist/index.js for 5s to capture startup output...")
try:
    r = subprocess.run(
        [NODE, "dist/index.js"],
        cwd=str(WORKSPACE),
        capture_output=True, text=True, timeout=5, env=_env,
        errors="replace"
    )
    print("STDOUT:", r.stdout[-2000:])
    print("STDERR:", r.stderr[-2000:])
    print("exit:", r.returncode)
except subprocess.TimeoutExpired as e:
    stdout = (e.stdout or b"").decode("utf-8", errors="replace") if isinstance(e.stdout, bytes) else (e.stdout or "")
    stderr = (e.stderr or b"").decode("utf-8", errors="replace") if isinstance(e.stderr, bytes) else (e.stderr or "")
    print("STDOUT (timeout):", stdout[-2000:])
    print("STDERR (timeout):", stderr[-2000:])
    print("[diag] Process ran 5s (expected for a server)")
