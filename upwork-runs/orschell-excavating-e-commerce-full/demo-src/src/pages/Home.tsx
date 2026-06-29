import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { productsApi, categoriesApi } from '../api/client';
import ProductCard from '../components/ProductCard';

export default function Home() {
  const [featured, setFeatured] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    productsApi.list({ featured: 'true', limit: 4 }).then(r => setFeatured(r.data.products || [])).catch(() => {});
    categoriesApi.list().then(r => setCategories(r.data.categories || [])).catch(() => {});
  }, []);

  return (
    <div>
      {/* Hero */}
      <div style={{ background: '#0D0F12', minHeight: 480, display: 'flex', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 60% 50%, rgba(247,107,16,0.08) 0%, transparent 70%)' }} />
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ maxWidth: 580 }}>
            <div style={{ display: 'inline-block', background: 'var(--accent)', color: '#fff', fontFamily: "'Barlow Condensed'", fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '3px 10px', marginBottom: 16 }}>
              Official Merch Store
            </div>
            <h1 style={{ fontSize: 'clamp(48px, 8vw, 80px)', fontWeight: 900, lineHeight: 0.95, marginBottom: 20, color: '#fff' }}>
              Can You<br /><span style={{ color: 'var(--accent)' }}>Dig It?</span>
            </h1>
            <p style={{ color: 'var(--muted)', fontSize: 16, marginBottom: 28, lineHeight: 1.6 }}>
              Official Orschell Excavating gear, safety equipment, and site supplies. Built for the field.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <Link to="/shop" className="btn">Shop Now</Link>
              <Link to="/shop?category=safety-gear" className="btn btn-outline">Safety Gear</Link>
            </div>
          </div>
        </div>
        <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '40%', background: 'repeating-linear-gradient(-45deg,rgba(247,107,16,0.04),rgba(247,107,16,0.04) 1px,transparent 1px,transparent 20px)' }} />
      </div>

      <div className="hazard" />

      {/* Category Grid */}
      <div style={{ background: 'var(--bg-surface)', padding: '60px 0' }}>
        <div className="container">
          <h2 style={{ fontSize: 36, marginBottom: 32 }}>Shop by Category</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
            {categories.map(cat => (
              <Link key={cat.id} to={`/shop?category=${cat.slug}`}
                style={{ background: 'var(--bg-card)', border: '2px solid #3E434D', borderRadius: 'var(--radius)', padding: '24px 16px', textAlign: 'center', transition: 'border-color 0.15s', display: 'block' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = '#3E434D')}>
                <p style={{ font: '700 18px "Barlow Condensed"', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{cat.name}</p>
                <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{cat.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="hazard" />

      {/* Featured Products */}
      <div style={{ padding: '60px 0' }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
            <h2 style={{ fontSize: 36 }}>Featured Products</h2>
            <Link to="/shop" style={{ color: 'var(--accent)', fontSize: 14, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>View All →</Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
            {featured.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      </div>

      {/* Footer band */}
      <div className="hazard" />
      <div style={{ background: '#0D0F12', padding: '40px 0', textAlign: 'center' }}>
        <div className="container">
          <p style={{ font: '700 28px "Barlow Condensed"', color: 'var(--accent)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Dirt Hammers. Can You Dig It?</p>
          <p style={{ color: 'var(--muted)', marginTop: 8, fontSize: 13 }}>Orschell Excavating &mdash; West Harrison, Indiana</p>
          <p style={{ color: '#444', marginTop: 24, fontSize: 11 }}>Demo built by Michael Wegter &mdash; Node.js + TypeScript + PostgreSQL-ready backend</p>
        </div>
      </div>
    </div>
  );
}
