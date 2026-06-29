import os, json, sqlite3, socket, subprocess, sys
from pathlib import Path

MWB = Path(os.environ.get('MW_BACKEND', r'C:\Users\mike\Desktop\projects\mw-backend'))
if not MWB.exists():
    for cand in [Path.cwd(), *Path.cwd().parents]:
        if (cand / 'server.py').exists():
            MWB = cand
            break

print('MWB:', MWB)

# services.json
svc_file = MWB / 'data' / 'services.json'
print('\n--- services.json ---')
if svc_file.exists():
    print(svc_file.read_text(encoding='utf-8', errors='replace')[:2000])
else:
    print('MISSING')

# candidate service dirs
candidates = [
    MWB / 'services' / 'orschell-ecommerce',
    MWB / 'data' / 'runner-workspace' / 'orschell-ecommerce',
]
for d in candidates:
    print(f'\n--- dir {d} ---')
    print('exists:', d.exists())
    if d.exists():
        dist = d / 'dist' / 'index.js'
        db = d / 'data' / 'orschell.db'
        dbts = d / 'src' / 'db' / 'database.ts'
        print('dist/index.js:', dist.exists(), dist.stat().st_size if dist.exists() else '')
        print('database.ts:', dbts.exists())
        if dbts.exists():
            txt = dbts.read_text(encoding='utf-8', errors='replace')
            print('database.ts has unsplash:', 'unsplash.com' in txt)
            print('database.ts has picsum:', 'picsum.photos' in txt)
        print('db:', db.exists(), db.stat().st_size if db.exists() else '')
        if db.exists():
            conn = sqlite3.connect(db)
            row = conn.execute("SELECT sku, image_url FROM products WHERE sku='OES-APP-001'").fetchone()
            print('OES-APP-001 image:', row[1][:80] if row else 'no row')
            unsplash = conn.execute("SELECT COUNT(*) FROM products WHERE image_url LIKE '%unsplash%'").fetchone()[0]
            picsum = conn.execute("SELECT COUNT(*) FROM products WHERE image_url LIKE '%picsum%'").fetchone()[0]
            print('unsplash count:', unsplash, 'picsum count:', picsum)
            conn.close()

# port 3742
print('\n--- port 3742 ---')
s = socket.socket()
s.settimeout(1)
try:
    s.connect(('127.0.0.1', 3742))
    print('LISTENING')
except Exception as e:
    print('NOT LISTENING:', e)
finally:
    s.close()

# netstat for 3742
try:
    r = subprocess.run(['netstat', '-ano'], capture_output=True, text=True, shell=True)
    lines = [ln for ln in r.stdout.splitlines() if ':3742' in ln and 'LISTENING' in ln]
    print('netstat:', lines[:5] if lines else 'none')
except Exception as e:
    print('netstat err:', e)
