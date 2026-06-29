import os, sqlite3

BASE = os.path.join(os.getcwd(), 'orschell-ecommerce')
DB_PATH = os.path.join(BASE, 'data', 'orschell.db')

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

print('DB:', DB_PATH, 'exists:', os.path.exists(DB_PATH))

if not os.path.exists(DB_PATH):
    print('ERROR: database file not found')
    raise SystemExit(1)

conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()
before = cur.execute("SELECT image_url FROM products WHERE sku='OES-HAT-001'").fetchone()
print('before OES-HAT-001:', before[0][:60] if before else 'missing')

for sku, url in IMAGES.items():
    cur.execute('UPDATE products SET image_url = ? WHERE sku = ?', (url, sku))

conn.commit()

after_hat = cur.execute("SELECT image_url FROM products WHERE sku='OES-HAT-001'").fetchone()
print('after OES-HAT-001:', after_hat[0][:60] if after_hat else 'missing')
after_saf = cur.execute("SELECT image_url FROM products WHERE sku='OES-SAF-001'").fetchone()
print('after OES-SAF-001:', after_saf[0][:60] if after_saf else 'missing')

count = cur.execute("SELECT COUNT(*) FROM products WHERE image_url LIKE '%unsplash%'").fetchone()[0]
picsum = cur.execute("SELECT COUNT(*) FROM products WHERE image_url LIKE '%picsum%'").fetchone()[0]
print('unsplash count:', count, '| picsum count:', picsum)
conn.close()
print('DONE')
