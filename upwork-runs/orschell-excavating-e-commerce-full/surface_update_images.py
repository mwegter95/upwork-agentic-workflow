import os, base64, subprocess, sys

BASE = os.path.join(os.getcwd(), 'orschell-ecommerce')
DB_SRC = os.path.join(BASE, 'src', 'db', 'database.ts')

# database.ts is passed as base64 on stdin line 2 by the caller
if len(sys.argv) < 2:
    print('usage: surface_update_images.py <database.ts.b64>')
    sys.exit(1)

with open(sys.argv[1], 'rb') as f:
    content = base64.b64decode(f.read())

os.makedirs(os.path.dirname(DB_SRC), exist_ok=True)
with open(DB_SRC, 'wb') as f:
    f.write(content)
print(f'wrote {DB_SRC} ({len(content)} bytes)')

npm_cmd = 'npm.cmd' if sys.platform == 'win32' else 'npm'
tsc_name = 'tsc.cmd' if sys.platform == 'win32' else 'tsc'
tsc_path = os.path.join(BASE, 'node_modules', '.bin', tsc_name)

print('[build] tsc...')
r = subprocess.run([tsc_path, '--build'], cwd=BASE, capture_output=True, text=True, shell=False)
if r.returncode != 0:
    print(r.stdout[-2000:] if r.stdout else '')
    print(r.stderr[-2000:] if r.stderr else '')
    print('tsc FAILED', r.returncode)
    sys.exit(r.returncode)

print('[build] SUCCESS - service will pick up changes on next restart')
