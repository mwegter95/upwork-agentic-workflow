import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { productsApi, categoriesApi } from '../api/client';
import ProductCard from '../components/ProductCard';

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState(searchParams.get('search') || '');

  const category = searchParams.get('category') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);

  const load = useCallback(() => {
    setLoading(true);
    const params: Record<string, string | number> = { page, limit: 12 };
    if (category) params.category = category;
    if (search) params.search = search;
    productsApi.list(params).then(r => {
      setProducts(r.data.products || []);
      setPagination(r.data.pagination || { page: 1, totalPages: 1, total: 0 });
    }).catch(() => {}).finally(() => setLoading(false));
  }, [category, page, search]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { categoriesApi.list().then(r => setCategories(r.data.categories || [])).catch(() => {}); }, []);

  function setFilter(key: string, value: string) {
    const p = new URLSearchParams(searchParams);
    if (value) p.set(key, value); else p.delete(key);
    p.delete('page');
    setSearchParams(p);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setFilter('search', search);
  }

  const activeCategory = categories.find(c => c.slug === category);

  return (
    <div style={{ minHeight: '100vh' }}>
      <div style={{ background: 'var(--bg-surface)', borderBottom: 'var(--border)', padding: '20px 0' }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: 28 }}>{activeCategory ? activeCategory.name : 'All Products'}</h1>
            <span style={{ color: 'var(--muted)', fontSize: 14 }}>({pagination.total} items)</span>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <form onSubmit={handleSearch} style={{ display: 'flex', gap: 6 }}>
                <input type="text" placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: 200 }} />
                <button type="submit" className="btn btn-sm">Search</button>
                {search && <button type="button" className="btn-ghost btn btn-sm" onClick={() => { setSearch(''); setFilter('search', ''); }}>Clear</button>}
              </form>
            </div>
          </div>
        </div>
      </div>

      <div className="container" style={{ padding: '24px 20px', display: 'flex', gap: 24 }}>
        {/* Sidebar filters */}
        <div style={{ width: 200, flexShrink: 0 }}>
          <h3 style={{ fontSize: 14, marginBottom: 12 }}>Category</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <button onClick={() => setFilter('category', '')} style={{ background: category === '' ? 'var(--accent)' : 'var(--bg-card)', border: 'var(--border)', color: category === '' ? '#fff' : 'var(--text)', padding: '7px 12px', textAlign: 'left', borderRadius: 'var(--radius)', fontSize: 13 }}>
              All Products
            </button>
            {categories.map(cat => (
              <button key={cat.id} onClick={() => setFilter('category', cat.slug)} style={{ background: category === cat.slug ? 'var(--accent)' : 'var(--bg-card)', border: 'var(--border)', color: category === cat.slug ? '#fff' : 'var(--text)', padding: '7px 12px', textAlign: 'left', borderRadius: 'var(--radius)', fontSize: 13 }}>
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Product grid */}
        <div style={{ flex: 1 }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><span className="spinner" style={{ width: 32, height: 32 }} /></div>
          ) : products.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: 'var(--muted)' }}>
              <p>No products found.</p>
              <button onClick={() => { setSearch(''); setSearchParams({}); }} className="btn" style={{ marginTop: 16 }}>Clear Filters</button>
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
                {products.map(p => <ProductCard key={p.id} product={p} />)}
              </div>
              {pagination.totalPages > 1 && (
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(p => (
                    <button key={p} onClick={() => setFilter('page', String(p))} className={`btn btn-sm ${p === page ? '' : 'btn-ghost'}`}>{p}</button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
