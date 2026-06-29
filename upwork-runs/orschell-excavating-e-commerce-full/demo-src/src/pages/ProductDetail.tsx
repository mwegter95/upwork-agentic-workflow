import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { productsApi } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const { addItem } = useCart();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!slug) return;
    productsApi.get(slug).then(r => setProduct(r.data.product)).catch(() => setProduct(null)).finally(() => setLoading(false));
  }, [slug]);

  async function handleAdd() {
    if (!user) { window.location.href = '/demos/orschell-excavating-e-commerce-full/#/login'; return; }
    setAdding(true);
    try {
      await addItem(product.id, qty);
      setMsg('Added to cart!');
      setTimeout(() => setMsg(''), 2500);
    } catch (e: any) {
      setMsg(e.response?.data?.error || 'Could not add to cart');
    } finally { setAdding(false); }
  }

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><span className="spinner" style={{ width: 36, height: 36 }} /></div>;
  if (!product) return <div className="container" style={{ padding: '80px 20px', textAlign: 'center', color: 'var(--muted)' }}><h2>Product not found.</h2><Link to="/shop" className="btn" style={{ marginTop: 16, display: 'inline-block' }}>Back to Shop</Link></div>;

  const outOfStock = product.quantity <= 0;
  const lowStock = product.quantity > 0 && product.quantity <= product.low_stock_threshold;
  const specs = product.specs_json ? (() => { try { return JSON.parse(product.specs_json); } catch { return null; } })() : null;

  return (
    <div className="container" style={{ padding: '40px 20px' }}>
      <nav style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 24, display: 'flex', gap: 6, alignItems: 'center' }}>
        <Link to="/" style={{ color: 'var(--muted)' }}>Home</Link>
        <span>/</span>
        <Link to="/shop" style={{ color: 'var(--muted)' }}>Shop</Link>
        <span>/</span>
        <Link to={`/shop?category=${product.category_slug}`} style={{ color: 'var(--muted)' }}>{product.category_name}</Link>
        <span>/</span>
        <span style={{ color: 'var(--text)' }}>{product.name}</span>
      </nav>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48 }}>
        <div>
          <img src={product.image_url} alt={product.name} style={{ width: '100%', borderRadius: 'var(--radius)', border: '2px solid #3E434D' }} onError={e => { e.currentTarget.src = `https://picsum.photos/seed/${product.id}/600/450`; }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <span className="badge badge-orange" style={{ marginBottom: 10, display: 'inline-block' }}>{product.category_name}</span>
            <h1 style={{ fontSize: 36, lineHeight: 1.1, marginBottom: 8 }}>{product.name}</h1>
            <p style={{ color: 'var(--muted)', fontSize: 13 }}>SKU: {product.sku}</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ font: '700 40px "Barlow Condensed"', color: 'var(--accent)' }}>${product.price.toFixed(2)}</span>
            {outOfStock ? <span className="badge badge-danger">Out of Stock</span>
              : lowStock ? <span className="badge badge-warning">Low Stock — {product.quantity} left</span>
              : <span className="badge badge-success">In Stock ({product.quantity})</span>}
          </div>

          <p style={{ color: 'var(--muted)', lineHeight: 1.7, fontSize: 15 }}>{product.description}</p>

          {specs && (
            <div style={{ background: 'var(--bg-card)', border: 'var(--border)', borderRadius: 'var(--radius)', padding: 16 }}>
              <h4 style={{ fontSize: 14, marginBottom: 10 }}>Specifications</h4>
              {Object.entries(specs).map(([k, v]) => (
                <div key={k} style={{ display: 'flex', gap: 12, fontSize: 13, marginBottom: 4 }}>
                  <span style={{ color: 'var(--muted)', minWidth: 120 }}>{k}</span>
                  <span>{String(v)}</span>
                </div>
              ))}
            </div>
          )}

          {!outOfStock && (
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-card)', border: 'var(--border)', borderRadius: 'var(--radius)', padding: '6px 12px' }}>
                <button onClick={() => setQty(q => Math.max(1, q - 1))} style={{ background: 'none', border: 'none', color: 'var(--text)', fontSize: 18, lineHeight: 1 }}>-</button>
                <span style={{ minWidth: 30, textAlign: 'center', fontWeight: 600 }}>{qty}</span>
                <button onClick={() => setQty(q => Math.min(product.quantity, q + 1))} style={{ background: 'none', border: 'none', color: 'var(--text)', fontSize: 18, lineHeight: 1 }}>+</button>
              </div>
              <button className="btn" onClick={handleAdd} disabled={adding || outOfStock} style={{ flex: 1 }}>
                {adding ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Adding...</> : 'Add to Cart'}
              </button>
            </div>
          )}

          {msg && <p style={{ color: msg.includes('Added') ? 'var(--success)' : 'var(--danger)', fontSize: 14 }}>{msg}</p>}

          {!user && <p style={{ color: 'var(--muted)', fontSize: 13 }}><Link to="/login" style={{ color: 'var(--accent)' }}>Sign in</Link> to add items to your cart.</p>}
        </div>
      </div>
    </div>
  );
}
