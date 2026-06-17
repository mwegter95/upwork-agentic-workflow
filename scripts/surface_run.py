#!/usr/bin/env python3
"""
surface_run.py — run a script on the Surface via mw-backend's /run/exec endpoint.

Lets the workflow build/deploy REAL backends on the Surface (install runtimes,
build services, start them) instead of mocking. Reads RUN_SECRET (and optional
RUN_BASE_URL) from the environment or the workflow's .env. Prints the remote
stdout/stderr and exits with the remote script's exit code.

Usage:
  python scripts/surface_run.py --lang bash --file deploy.sh
  echo 'print(2+2)' | python scripts/surface_run.py
  python scripts/surface_run.py --lang bash --cwd /path -t 900 --file build.sh
"""
import os
import sys
import json
import time
import hmac
import hashlib
import argparse
import urllib.request
import urllib.error
from pathlib import Path


def load_secret_and_base():
    secret = os.environ.get("RUN_SECRET")
    base = os.environ.get("RUN_BASE_URL")
    if secret:
        return secret, base
    env_path = Path(__file__).resolve().parent.parent / ".env"
    if env_path.exists():
        for line in env_path.read_text().splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            v = v.strip().strip('"').strip("'")
            if k.strip() == "RUN_SECRET" and not secret:
                secret = v
            elif k.strip() == "RUN_BASE_URL" and not base:
                base = v
    return secret, base


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--lang", default="python", choices=["python", "bash"])
    ap.add_argument("--file", help="script file; if omitted, read from stdin")
    ap.add_argument("--cwd", help="working directory on the Surface")
    ap.add_argument("-t", "--timeout", type=int, default=600)
    ap.add_argument("--url", help="override base URL (default RUN_BASE_URL or api.michaelwegter.com)")
    args = ap.parse_args()

    secret, base = load_secret_and_base()
    if not secret:
        print("surface_run: RUN_SECRET not set (env or .env). Cannot authenticate.", file=sys.stderr)
        sys.exit(2)
    base = (args.url or base or "https://api.michaelwegter.com").rstrip("/")
    script = Path(args.file).read_text() if args.file else sys.stdin.read()
    if not script.strip():
        print("surface_run: empty script.", file=sys.stderr)
        sys.exit(2)

    payload = {"language": args.lang, "script": script, "timeout": args.timeout}
    if args.cwd:
        payload["cwd"] = args.cwd
    body = json.dumps(payload).encode()
    ts = str(int(time.time()))
    sig = hmac.new(secret.encode(), ts.encode() + b"." + body, hashlib.sha256).hexdigest()
    req = urllib.request.Request(
        base + "/run/exec", data=body, method="POST",
        headers={"Content-Type": "application/json", "X-Run-Timestamp": ts, "X-Run-Signature": sig},
    )
    try:
        with urllib.request.urlopen(req, timeout=args.timeout + 30) as r:
            res = json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        print(f"surface_run: HTTP {e.code}: {e.read().decode()[:500]}", file=sys.stderr)
        sys.exit(3)
    except Exception as e:
        print(f"surface_run: request failed: {e}", file=sys.stderr)
        sys.exit(3)

    if res.get("stdout"):
        sys.stdout.write(res["stdout"])
    if res.get("stderr"):
        sys.stderr.write(res["stderr"])
    if res.get("truncated"):
        print("\n[surface_run: output truncated]", file=sys.stderr)
    if res.get("timed_out"):
        print(f"[surface_run: timed out after {args.timeout}s]", file=sys.stderr)
    sys.exit(int(res.get("exit_code", 1)))


if __name__ == "__main__":
    main()
