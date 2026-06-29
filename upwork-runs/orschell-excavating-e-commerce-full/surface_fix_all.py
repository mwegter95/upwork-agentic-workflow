import json, os, shutil, sqlite3, subprocess, sys, time
from pathlib import Path

MWB = Path(r'C:\Users\mike\Desktop\projects\mw-backend')
SVC = MWB / 'services' / 'orschell-ecommerce'
OLD = MWB / 'data' / 'runner-workspace' / 'orschell-ecommerce'
SVC_FILE = MWB / 'data' / 'services.json'
MANIFEST = MWB / 'services.manifest.json'
PORT = 3742

IMAGES = {
    'OES-APP-001': 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=300&fit=crop&auto=format',
    'OES-APP-002': 'https://images.unsplash.com/photo-1576566588023-fa24843b1cd5?w=400&h=300&fit=crop&auto=format',
    'OES-APP-003': 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400&h=300&fit=crop&auto=format',
    'OES-APP-004': 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&h=300&fit=crop&auto=format',
    'OES-APP-005': 'https://images.unsplash.com/photo-1620799140408-ed84325994bf?w=400&h=300&fit=crop&auto=format',
    'OES-APP-006': 'https://images.unsplash.com/photo-1622445275463-091aa092ee53?w=400&h=300&fit=crop&auto=format',
    'OES-APP-007': 'https://images.unsplash.com/photo-1622445275278-aa1872a4d472?w=400&h=300&fit=crop&auto=format',
    'OES-HAT-001': 'https://images.unsplash.com/photo-1588854337115-641cb87f495d?w=400&h=300&fit=crop&auto=format',
    'OES-HAT-002': 'https://images.unsplash.com/photo-1575428652379-f29a2ecb84ec?w=400&h=300&fit=crop&auto=format',
    'OES-HAT-003': 'https://images.unsplash.com/photo-1576871337628-94c88e106bb6?w=400&h=300&fit=crop&auto=format',
    'OES-HAT-004': 'https://images.unsplash.com/photo-1584196140869-4ad659ba2f69?w=400&h=300&fit=crop&auto=format',
    'OES-SAF-001': 'https://images.unsplash.com/photo-1581094794329-c8112a89af11?w=400&h=300&fit=crop&auto=format',
    'OES-SAF-002': 'https://images.unsplash.com/photo-1504307651254-35680f386031?w=400&h=300&fit=crop&auto=format',
    'OES-SAF-003': 'https://images.unsplash.com/photo-1574258493463-597affd85e3b?w=400&h=300&fit=crop&auto=format',
    'OES-SAF-004': 'https://images.unsplash.com/photo-1606107557195-0dfe29fe3931?w=400&h=300&fit=crop&auto=format',
    'OES-SAF-005': 'https://images.unsplash.com/photo-1544967080-df0861341047?w=400&h=300&fit=crop&auto=format',
    'OES-SIT-001': 'https://images.unsplash.com/photo-1581235720905-c7856a69de87?w=400&h=300&fit=crop&auto=format',
    'OES-SIT-002': 'https://images.unsplash.com/photo-1581574260467-24ac2a95a7d3?w=400&h=300&fit=crop&auto=format',
    'OES-SIT-003': 'https://images.unsplash.com/photo-1513828583688-c42646deb504?w=400&h=300&fit=crop&auto=format',
    'OES-SIT-004': 'https://images.unsplash.com/photo-1594035910387-bea5f4b2b2d4?w=400&h=300&fit=crop&auto=format',
    'OES-SIT-005': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop&auto=format',
    'OES-ACC-001': 'https://images.unsplash.com/photo-1615663645117-c27aa2f64d90?w=400&h=300&fit=crop&auto=format',
    'OES-ACC-002': 'https://images.unsplash.com/photo-1579204110769-ab43dead279a?w=400&h=300&fit=crop&auto=format',
    'OES-ACC-003': 'https://images.unsplash.com/photo-1614686846290-a38c4da37827?w=400&h=300&fit=crop&auto=format',
    'OES-ACC-004': 'https://images.unsplash.com/photo-1611157209089-9d8e9eb7d870?w=400&h=300&fit=crop&auto=format',
}


def flatten_services(raw):
    out = []
    if isinstance(raw, list):
        items = raw
    elif isinstance(raw, dict):
        items = [raw]
    else:
        return out
    for item in items:
        if not isinstance(item, dict):
            continue
        if item.get('name') and item.get('port'):
            out.append({
                'name': item['name'],
                'cmd': item.get('cmd', 'node'),
                'args': item.get('args', 'dist/index.js'),
                'cwd': item.get('cwd', '.'),
                'port': int(item['port']),
            })
            continue
        nested = item.get('value')
        if isinstance(nested, list):
            out.extend(flatten_services(nested))
    return out


def kill_port(port):
    r = subprocess.run(['netstat', '-ano'], capture_output=True, text=True, shell=True)
    pids = set()
    for line in r.stdout.splitlines():
        if f':{port} ' in line and 'LISTENING' in line:
            parts = line.split()
            if parts:
                pids.add(parts[-1])
    for pid in pids:
        if pid and pid != '0':
            subprocess.run(['taskkill', '/F', '/PID', pid], capture_output=True, shell=True)
            print(f'killed PID {pid} on port {port}')


def update_db(db_path):
    conn = sqlite3.connect(str(db_path))
    conn.execute('PRAGMA wal_checkpoint(FULL)')
    cur = conn.cursor()
    tables = cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='products'").fetchone()
    if not tables:
        conn.close()
        print(f'skip {db_path}: no products table')
        return False
    for sku, url in IMAGES.items():
        cur.execute('UPDATE products SET image_url = ? WHERE sku = ?', (url, sku))
    conn.commit()
    row = cur.execute("SELECT image_url FROM products WHERE sku='OES-APP-001'").fetchone()
    unsplash = cur.execute("SELECT COUNT(*) FROM products WHERE image_url LIKE '%unsplash%'").fetchone()[0]
    conn.close()
    print(f'updated {db_path}: OES-APP-001={row[0][:60]} unsplash={unsplash}')
    return True


def copy_sqlite_db(src_dir, dst_dir):
    dst_dir.mkdir(parents=True, exist_ok=True)
    for suffix in ('', '-wal', '-shm'):
        src = src_dir / f'orschell.db{suffix}'
        if src.exists():
            shutil.copy2(src, dst_dir / f'orschell.db{suffix}')
            print(f'copied {src.name}')


# 1) normalize services.json
existing = []
if SVC_FILE.exists():
    try:
        existing = flatten_services(json.loads(SVC_FILE.read_text(encoding='utf-8')))
    except Exception as e:
        print('warn: could not parse services.json:', e)

manifest = json.loads(MANIFEST.read_text(encoding='utf-8'))
by_name = {s['name']: s for s in existing if s.get('name')}
for entry in manifest:
    by_name[entry['name']] = entry

clean = list(by_name.values())
SVC_FILE.write_text(json.dumps(clean, indent=2), encoding='utf-8')
print('wrote services.json entries:', [s['name'] for s in clean])

# 2) update live DB in runner-workspace, then copy full sqlite set to repo service dir
data_dir = SVC / 'data'
old_data = OLD / 'data'
old_db = old_data / 'orschell.db'

if old_db.exists():
    update_db(old_db)

if old_data.exists():
    copy_sqlite_db(old_data, data_dir)
elif not (data_dir / 'orschell.db').exists():
    print('no existing db; new service will seed on start')

db_path = data_dir / 'orschell.db'
if db_path.exists():
    update_db(db_path)

# 3) build repo service
npm = 'npm.cmd'
subprocess.run([npm, 'install'], cwd=SVC, check=True, shell=True)
subprocess.run([npm, 'run', 'build'], cwd=SVC, check=True, shell=True)
print('build OK')

# 4) restart node on 3742
kill_port(PORT)
time.sleep(2)

# 5) start service directly so we know cwd is correct
node = 'node'
log_out = MWB / 'data' / 'orschell-ecommerce-api.log'
log_err = MWB / 'data' / 'orschell-ecommerce-api.err.log'
with open(log_out, 'a', encoding='utf-8') as fo, open(log_err, 'a', encoding='utf-8') as fe:
    p = subprocess.Popen(
        [node, 'dist/index.js'],
        cwd=SVC,
        stdout=fo,
        stderr=fe,
        creationflags=subprocess.CREATE_NEW_PROCESS_GROUP if hasattr(subprocess, 'CREATE_NEW_PROCESS_GROUP') else 0,
    )
print(f'started orschell-ecommerce-api PID {p.pid} cwd={SVC}')

# 6) wait and verify
for i in range(15):
    time.sleep(1)
    try:
        import urllib.request
        resp = urllib.request.urlopen('http://127.0.0.1:3742/products?limit=1', timeout=2)
        data = json.loads(resp.read().decode())
        img = data['products'][0]['image_url']
        print('VERIFY image:', img[:80])
        if 'unsplash' in img:
            print('SUCCESS')
            sys.exit(0)
    except Exception as e:
        print(f'wait {i+1}: {e}')

print('FAILED verify')
sys.exit(1)
