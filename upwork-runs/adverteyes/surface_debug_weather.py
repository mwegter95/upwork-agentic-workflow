# -*- coding: utf-8 -*-
#!/usr/bin/env python3
"""Debug weather 502 - get response body and also test Open-Meteo directly."""
import json, sys, urllib.request, urllib.error

BASE = "http://127.0.0.1:3741"

def req_raw(method, path, body=None, token=None):
    url = BASE + path
    headers = {"Content-Type": "application/json"}
    if token: headers["Authorization"] = "Bearer " + token
    data = json.dumps(body).encode() if body else None
    try:
        r = urllib.request.urlopen(
            urllib.request.Request(url, data=data, headers=headers, method=method), timeout=15)
        return r.status, json.loads(r.read())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read())

# Login
status, resp = req_raw("POST", "/auth/login", {"email": "admin@adverteyes.com", "password": "Admin123!"})
token = resp.get("token")
print(f"Login: {status}, token={'ok' if token else 'missing'}")

# Weather request - capture error body
status, body = req_raw("GET", "/weather/1", token=token)
print(f"Weather /1 status: {status}")
print(f"Response body: {json.dumps(body, indent=2)}")

# Also test Open-Meteo directly from Surface
print("\n[direct] Testing Open-Meteo from Surface...")
try:
    om_url = ("https://api.open-meteo.com/v1/forecast"
              "?latitude=28.0854&longitude=-82.4374"
              "&current=temperature_2m,wind_speed_10m"
              "&temperature_unit=fahrenheit&wind_speed_unit=mph"
              "&timezone=auto&forecast_days=1")
    req2 = urllib.request.Request(om_url, headers={
        "Accept": "application/json",
        "Accept-Encoding": "gzip, deflate",
        "User-Agent": "adverteyes-test/1.0"
    })
    r2 = urllib.request.urlopen(req2, timeout=15)
    raw = json.loads(r2.read())
    print(f"Open-Meteo direct: {r2.status}")
    print(f"current.temperature_2m: {raw.get('current', {}).get('temperature_2m')}")
    print("Direct fetch OK")
except Exception as e:
    print(f"Direct Open-Meteo FAILED: {e}")
