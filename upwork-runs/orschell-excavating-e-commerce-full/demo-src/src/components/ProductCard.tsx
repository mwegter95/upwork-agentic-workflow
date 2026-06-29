import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useState } from 'react';

interface Product {
  id: number;
  slug: string;
  name: string;
  price: number;
  image_url: string;
  category_name: string;
  category_slug: string;
  quantity: number;
  low_stock_threshold: number;
  featured: number;
  sku: string;
}

export default function ProductCard({ product }: { product: Product }) {
  const { user } = useAuth();
  const { addItem } = useCart();
  const [adding, setAdding] = useState(false);

  const lowStock = product.quantity > 0 && product.quantity <= product.low_stock_threshold;
  const outOfStock = product.quantity <= 0;

  async function handleAdd() {
    if (!user) { window.location.href = '/demos/orschell-excavating-e-commerce-full/#/login'; return; }
    if (outOfStock) return;
    setAdding(true);
    try { await addItem(product.id); } catch {}
    finally { setAdding(false); }
  }

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', transition: 'border-color 0.15s', position: 'relative' }}>
      {product.featured === 1 && (
        <div style={{ position: 'absolute', top: 8, left: 8, zIndex: 1 }}>
          <span className="badge badge-orange">Featured</span>
        </div>
      )}
      {outOfStock && (
        <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}>
          <span className="badge badge-danger">Out of Stock</span>
        </div>
      )}
      {lowStock && !outOfStock && (
        <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}>
          <span className="badge badge-warning">Low Stock</span>
        </div>
      )}

      <Link to={`/products/${product.slug}`} style={{ display: 'block', overflow: 'hidden', height: 200 }}>
        <img
          src={product.image_url}
          alt={product.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.2s' }}
          onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.03)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
          onError={e => { e.currentTarget.src = `https://picsum.photos/seed/${product.id}/400/300`; }}
        />
      </Link>

      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="badge badge-orange">{product.category_name}</span>
        </div>
        <Link to={`/products/${product.slug}`}>
          <h3 style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.2, color: 'var(--text)' }}>{product.name}</h3>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 8 }}>
          <span style={{ font: '700 22px "Barlow Condensed"', color: 'var(--accent)', letterSpacing: '0.02em' }}>
            ${product.price.toFixed(2)}
          </span>
          <button className="btn btn-sm" onClick={handleAdd} disabled={outOfStock || adding} style={{ minWidth: 80 }}>
            {adding ? <span className="spinner" style={{ width: 14, height: 14 }} /> : outOfStock ? 'Sold Out' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  );
}
