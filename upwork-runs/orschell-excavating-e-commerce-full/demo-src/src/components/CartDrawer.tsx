import { useCart } from '../contexts/CartContext';
import { Link } from 'react-router-dom';

export default function CartDrawer() {
  const { items, drawerOpen, closeDrawer, updateItem, removeItem, itemCount, subtotal } = useCart();

  if (!drawerOpen) return null;

  return (
    <>
      <div onClick={closeDrawer} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 300 }} />
      <div style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: 380, background: 'var(--bg-surface)', zIndex: 301, display: 'flex', flexDirection: 'column', boxShadow: '-4px 0 20px rgba(0,0,0,0.5)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: 'var(--border)' }}>
          <h2 style={{ fontSize: 22 }}>Cart ({itemCount})</h2>
          <button onClick={closeDrawer} style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 22 }}>✕</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {items.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--muted)', marginTop: 60 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🛒</div>
              <p>Your cart is empty.</p>
              <button onClick={closeDrawer} className="btn" style={{ marginTop: 16 }}>Keep Shopping</button>
            </div>
          ) : items.map(item => (
            <div key={item.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', background: 'var(--bg-card)', border: 'var(--border)', padding: 10, borderRadius: 'var(--radius)' }}>
              <img src={item.image_url} alt={item.name} style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 2, flexShrink: 0 }} onError={e => { e.currentTarget.src = `https://picsum.photos/seed/${item.product_id}/64/64`; }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{item.name}</p>
                <p style={{ font: '700 16px "Barlow Condensed"', color: 'var(--accent)' }}>${item.price.toFixed(2)}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                  <button onClick={() => item.quantity > 1 ? updateItem(item.id, item.quantity - 1) : removeItem(item.id)} style={{ background: 'var(--bg-input)', border: 'var(--border)', color: 'var(--text)', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 2 }}>-</button>
                  <span style={{ fontSize: 13, minWidth: 20, textAlign: 'center' }}>{item.quantity}</span>
                  <button onClick={() => updateItem(item.id, item.quantity + 1)} style={{ background: 'var(--bg-input)', border: 'var(--border)', color: 'var(--text)', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 2 }} disabled={item.quantity >= item.stock}>+</button>
                  <button onClick={() => removeItem(item.id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', fontSize: 13, marginLeft: 'auto' }}>Remove</button>
                </div>
              </div>
              <p style={{ font: '700 16px "Barlow Condensed"', color: 'var(--text)', whiteSpace: 'nowrap' }}>${(item.price * item.quantity).toFixed(2)}</p>
            </div>
          ))}
        </div>

        {items.length > 0 && (
          <div style={{ padding: '16px 20px', borderTop: 'var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: 15 }}>
              <span style={{ color: 'var(--muted)' }}>Subtotal</span>
              <span style={{ font: '700 18px "Barlow Condensed"' }}>${subtotal.toFixed(2)}</span>
            </div>
            <Link to="/checkout" onClick={closeDrawer} className="btn" style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
              Checkout
            </Link>
            <button onClick={closeDrawer} className="btn-ghost btn" style={{ width: '100%', marginTop: 8, justifyContent: 'center' }}>
              Continue Shopping
            </button>
          </div>
        )}
      </div>
    </>
  );
}
