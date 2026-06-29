import os, subprocess, sys, sqlite3

BASE = os.path.join(os.getcwd(), 'orschell-ecommerce')
DB_SRC = os.path.join(BASE, 'src', 'db', 'database.ts')

NEW_IMAGES_BLOCK = """// Category-matched product images (Unsplash, cropped to 400x300, all verified 200)
const PRODUCT_IMAGES: Record<string, string> = {
  'OES-APP-001': 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=300&fit=crop&auto=format',
  'OES-APP-002': 'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=400&h=300&fit=crop&auto=format',
  'OES-APP-003': 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400&h=300&fit=crop&auto=format',
  'OES-APP-004': 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&h=300&fit=crop&auto=format',
  'OES-APP-005': 'https://images.unsplash.com/photo-1512374382149-233c42b6a83b?w=400&h=300&fit=crop&auto=format',
  'OES-APP-006': 'https://images.unsplash.com/photo-1503341733017-1901578f9f1e?w=400&h=300&fit=crop&auto=format',
  'OES-APP-007': 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400&h=300&fit=crop&auto=format',
  'OES-HAT-001': 'https://images.unsplash.com/photo-1521369909029-2afed882baee?w=400&h=300&fit=crop&auto=format',
  'OES-HAT-002': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop&auto=format',
  'OES-HAT-003': 'https://images.unsplash.com/photo-1545346315-f4c47e3e1b55?w=400&h=300&fit=crop&auto=format',
  'OES-HAT-004': 'https://images.unsplash.com/photo-1564584217132-2271feaeb3c5?w=400&h=300&fit=crop&auto=format',
  'OES-SAF-001': 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400&h=300&fit=crop&auto=format',
  'OES-SAF-002': 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400&h=300&fit=crop&auto=format',
  'OES-SAF-003': 'https://images.unsplash.com/photo-1559825481-12a05cc00344?w=400&h=300&fit=crop&auto=format',
  'OES-SAF-004': 'https://images.unsplash.com/photo-1602872030490-4a484a7b3ba6?w=400&h=300&fit=crop&auto=format',
  'OES-SAF-005': 'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=400&h=300&fit=crop&auto=format',
  'OES-SIT-001': 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=400&h=300&fit=crop&auto=format',
  'OES-SIT-002': 'https://images.unsplash.com/photo-1565183928294-7063f23ce0f8?w=400&h=300&fit=crop&auto=format',
  'OES-SIT-003': 'https://images.unsplash.com/photo-1593618998160-e34014e67546?w=400&h=300&fit=crop&auto=format',
  'OES-SIT-004': 'https://images.unsplash.com/photo-1569263979104-865ab7cd8d13?w=400&h=300&fit=crop&auto=format',
  'OES-SIT-005': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop&auto=format',
  'OES-ACC-001': 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=400&h=300&fit=crop&auto=format',
  'OES-ACC-002': 'https://images.unsplash.com/photo-1589998059171-988d887df646?w=400&h=300&fit=crop&auto=format',
  'OES-ACC-003': 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=400&h=300&fit=crop&auto=format',
  'OES-ACC-004': 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=300&fit=crop&auto=format',
};"""

IMAGES = {
    'OES-APP-001': 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=300&fit=crop&auto=format',
    'OES-APP-002': 'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=400&h=300&fit=crop&auto=format',
    'OES-APP-003': 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400&h=300&fit=crop&auto=format',
    'OES-APP-004': 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&h=300&fit=crop&auto=format',
    'OES-APP-005': 'https://images.unsplash.com/photo-1512374382149-233c42b6a83b?w=400&h=300&fit=crop&auto=format',
    'OES-APP-006': 'https://images.unsplash.com/photo-1503341733017-1901578f9f1e?w=400&h=300&fit=crop&auto=format',
    'OES-APP-007': 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400&h=300&fit=crop&auto=format',
    'OES-HAT-001': 'https://images.unsplash.com/photo-1521369909029-2afed882baee?w=400&h=300&fit=crop&auto=format',
    'OES-HAT-002': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop&auto=format',
    'OES-HAT-003': 'https://images.unsplash.com/photo-1545346315-f4c47e3e1b55?w=400&h=300&fit=crop&auto=format',
    'OES-HAT-004': 'https://images.unsplash.com/photo-1564584217132-2271feaeb3c5?w=400&h=300&fit=crop&auto=format',
    'OES-SAF-001': 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400&h=300&fit=crop&auto=format',
    'OES-SAF-002': 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400&h=300&fit=crop&auto=format',
    'OES-SAF-003': 'https://images.unsplash.com/photo-1559825481-12a05cc00344?w=400&h=300&fit=crop&auto=format',
    'OES-SAF-004': 'https://images.unsplash.com/photo-1602872030490-4a484a7b3ba6?w=400&h=300&fit=crop&auto=format',
    'OES-SAF-005': 'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=400&h=300&fit=crop&auto=format',
    'OES-SIT-001': 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=400&h=300&fit=crop&auto=format',
    'OES-SIT-002': 'https://images.unsplash.com/photo-1565183928294-7063f23ce0f8?w=400&h=300&fit=crop&auto=format',
    'OES-SIT-003': 'https://images.unsplash.com/photo-1593618998160-e34014e67546?w=400&h=300&fit=crop&auto=format',
    'OES-SIT-004': 'https://images.unsplash.com/photo-1569263979104-865ab7cd8d13?w=400&h=300&fit=crop&auto=format',
    'OES-SIT-005': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop&auto=format',
    'OES-ACC-001': 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=400&h=300&fit=crop&auto=format',
    'OES-ACC-002': 'https://images.unsplash.com/photo-1589998059171-988d887df646?w=400&h=300&fit=crop&auto=format',
    'OES-ACC-003': 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=400&h=300&fit=crop&auto=format',
    'OES-ACC-004': 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=300&fit=crop&auto=format',
}

# Step 1: Update database.ts source
import re
print('Updating database.ts source...')
src = open(DB_SRC, encoding='utf-8').read()
pattern = r'// Category-matched product images.*?^};'
match = re.search(pattern, src, re.DOTALL | re.MULTILINE)
if not match:
    print('ERROR: could not find PRODUCT_IMAGES block')
    raise SystemExit(1)
new_src = src[:match.start()] + NEW_IMAGES_BLOCK + src[match.end():]
open(DB_SRC, 'w', encoding='utf-8').write(new_src)
print('Updated database.ts')

# Step 2: Find tsc.cmd (Windows) and rebuild
tsc_cmd = os.path.join(BASE, 'node_modules', '.bin', 'tsc.cmd')
if not os.path.exists(tsc_cmd):
    tsc_cmd = os.path.join(BASE, 'node_modules', 'typescript', 'bin', 'tsc')
    use_node = True
else:
    use_node = False

print('Using tsc at:', tsc_cmd, 'exists:', os.path.exists(tsc_cmd))

if use_node:
    cmd = ['node', tsc_cmd]
else:
    cmd = [tsc_cmd]

result = subprocess.run(cmd, cwd=BASE, capture_output=True, text=True, timeout=120)
print('tsc exit:', result.returncode)
if result.stdout: print('stdout:', result.stdout[:500])
if result.stderr: print('stderr:', result.stderr[:500])

if result.returncode != 0:
    print('tsc failed - patching dist directly instead')
    dist_db = os.path.join(BASE, 'dist', 'db', 'database.js')
    if os.path.exists(dist_db):
        txt = open(dist_db, encoding='utf-8').read()
        # Patch old photo IDs with new ones in the compiled JS
        replacements = [
            ('photo-1576566588023-fa24843b1cd5', 'photo-1503341504253-dff4815485f1'),
            ('photo-1620799140408-ed84325994bf', 'photo-1512374382149-233c42b6a83b'),
            ('photo-1622445275463-091aa092ee53', 'photo-1503341733017-1901578f9f1e'),
            ('photo-1622445275278-aa1872a4d472', 'photo-1523381210434-271e8be1f52b'),
            ('photo-1588854337115-641cb87f495d', 'photo-1521369909029-2afed882baee'),
            ('photo-1575428652379-f29a2ecb84ec', 'photo-1578662996442-48f60103fc96'),
            ('photo-1576871337628-94c88e106bb6', 'photo-1545346315-f4c47e3e1b55'),
            ('photo-1584196140869-4ad659ba2f69', 'photo-1564584217132-2271feaeb3c5'),
            ('photo-1581094794329-c8112a89af11', 'photo-1607082348824-0a96f2a4b9da'),
            ('photo-1504307651254-35680f386031', 'photo-1513558161293-cdaf765ed2fd'),
            ('photo-1574258493463-597affd85e3b', 'photo-1559825481-12a05cc00344'),
            ('photo-1606107557195-0dfe29fe3931', 'photo-1602872030490-4a484a7b3ba6'),
            ('photo-1544967080-df0861341047', 'photo-1520903920243-00d872a2d1c9'),
            ('photo-1581235720905-c7856a69de87', 'photo-1589939705384-5185137a7f0f'),
            ('photo-1581574260467-24ac2a95a7d3', 'photo-1565183928294-7063f23ce0f8'),
            ('photo-1513828583688-c42646deb504', 'photo-1593618998160-e34014e67546'),
            ('photo-1594035910387-bea5f4b2b2d4', 'photo-1569263979104-865ab7cd8d13'),
            ('photo-1615663645117-c27aa2f64d90', 'photo-1593642632559-0c6d3fc62b89'),
            ('photo-1579204110769-ab43dead279a', 'photo-1589998059171-988d887df646'),
            ('photo-1614686846290-a38c4da37827', 'photo-1568702846914-96b305d2aaeb'),
            ('photo-1611157209089-9d8e9eb7d870', 'photo-1523275335684-37898b6baf30'),
        ]
        count_replaced = 0
        for old, new in replacements:
            if old in txt:
                txt = txt.replace(old, new)
                count_replaced += 1
        open(dist_db, 'w', encoding='utf-8').write(txt)
        print('Patched', count_replaced, 'photo IDs in compiled JS')
    else:
        print('ERROR: dist/db/database.js not found')
        raise SystemExit(1)
else:
    print('tsc build succeeded')

# Verify compiled output
dist_db = os.path.join(BASE, 'dist', 'db', 'database.js')
txt = open(dist_db, encoding='utf-8', errors='replace').read()
print('dist has new HAT-001 (1521369909):', 'photo-1521369909029' in txt)
print('dist has new SAF-001 (1607082348):', 'photo-1607082348824' in txt)
print('dist has OLD HAT-001 (1588854337):', '1588854337' in txt)
print('dist has OLD SAF-001 (1581094794):', '1581094794' in txt)

# Step 3: Update live DB
print('Updating live DB...')
DB_PATH = os.path.join(BASE, 'data', 'orschell.db')
conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()
for sku, url in IMAGES.items():
    cur.execute('UPDATE products SET image_url = ? WHERE sku = ?', (url, sku))
conn.commit()
count = cur.execute("SELECT COUNT(*) FROM products WHERE image_url LIKE '%unsplash%'").fetchone()[0]
picsum = cur.execute("SELECT COUNT(*) FROM products WHERE image_url LIKE '%picsum%'").fetchone()[0]
hat = cur.execute("SELECT image_url FROM products WHERE sku='OES-HAT-001'").fetchone()
saf = cur.execute("SELECT image_url FROM products WHERE sku='OES-SAF-001'").fetchone()
print('DB: unsplash count:', count, '| picsum count:', picsum)
print('OES-HAT-001:', hat[0][:70] if hat else 'missing')
print('OES-SAF-001:', saf[0][:70] if saf else 'missing')
conn.close()
print('ALL DONE')
