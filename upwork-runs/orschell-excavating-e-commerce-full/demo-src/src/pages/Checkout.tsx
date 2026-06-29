import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { ordersApi } from '../api/client';

const STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'];

export default function Checkout() {
  const { user } = useAuth();
  const { items, subtotal, refresh } = useCart();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: user?.name || '', street: '', city: '', state: 'IN', zip: '' });
  const [card, setCard] = useState({ number: '', expiry: '', cvv: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!user) return <Navigate to="/login" replace />;
  if (items.length === 0) return <Navigate to="/shop" replace />;

  const tax = parseFloat((subtotal * 0.07).toFixed(2));
  const total = parseFloat((subtotal + tax).toFixed(2));

  function setF(key: string) { return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm(f => ({ ...f, [key]: e.target.value })); }
  function setC(key: string) { return (e: React.ChangeEvent<HTMLInputElement>) => setCard(c => ({ ...c, [key]: e.target.value })); }

  function formatCard(v: string) { return v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim(); }
  function formatExpiry(v: string) { const d = v.replace(/\D/g, '').slice(0, 4); return d.length > 2 ? d.slice(0,2) + '/' + d.slice(2) : d; }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const r = await ordersApi.create({
        shipping_name: form.name,
        shipping_address: { street: form.street, city: form.city, state: form.state, zip: form.zip },
      });
      await refresh();
      navigate(`/orders/${r.data.order.id}/confirmation`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Checkout failed');
    } finally { setLoading(false); }
  }

  return (
    <div className="container" style={{ padding: '40px 20px', maxWidth: 860 }}>
      <h1 style={{ fontSize: 32, marginBottom: 32 }}>Checkout</h1>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 32 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Shipping */}
          <div className="card" style={{ padding: 24 }}>
            <h2 style={{ fontSize: 20, marginBottom: 20 }}>Shipping Information</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group"><label>Full Name</label><input type="text" value={form.name} onChange={setF('name')} required /></div>
              <div className="form-group"><label>Street Address</label><input type="text" value={form.street} onChange={setF('street')} required placeholder="123 Main St" /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 100px', gap: 12 }}>
                <div className="form-group"><label>City</label><input type="text" value={form.city} onChange={setF('city')} required /></div>
                <div className="form-group"><label>State</label><select value={form.state} onChange={setF('state')}>{STATES.map(s => <option key={s}>{s}</option>)}</select></div>
                <div className="form-group"><label>ZIP</label><input type="text" value={form.zip} onChange={setF('zip')} required pattern="\d{5}" maxLength={5} /></div>
              </div>
            </div>
          </div>

          {/* Payment */}
          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <h2 style={{ fontSize: 20 }}>Payment</h2>
              <span style={{ background: 'var(--warning)', color: '#000', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 2, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'Barlow Condensed'" }}>Demo / Mock Payment</span>
            </div>
            <div style={{ background: 'rgba(245,166,35,0.08)', border: '1px solid var(--warning)', borderRadius: 'var(--radius)', padding: '10px 14px', marginBottom: 16, fontSize: 13, color: 'var(--warning)' }}>
              This is a demonstration. No real payment will be processed.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label>Card Number</label>
                <input type="text" value={formatCard(card.number)} onChange={e => setCard(c => ({ ...c, number: e.target.value.replace(/\s/g, '') }))} placeholder="4111 1111 1111 1111" maxLength={19} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label>Expiry (MM/YY)</label>
                  <input type="text" value={formatExpiry(card.expiry)} onChange={e => setCard(c => ({ ...c, expiry: e.target.value }))} placeholder="MM/YY" maxLength={5} required />
                </div>
                <div className="form-group">
                  <label>CVV</label>
                  <input type="text" value={card.cvv} onChange={setC('cvv')} placeholder="123" maxLength={4} required pattern="\d{3,4}" />
                </div>
              </div>
            </div>
          </div>

          {error && <p style={{ color: 'var(--danger)', fontSize: 13, background: 'rgba(232,64,64,0.1)', padding: '10px 14px', borderRadius: 'var(--radius)' }}>{error}</p>}

          <button type="submit" className="btn" disabled={loading} style={{ fontSize: 16, padding: '14px 0' }}>
            {loading ? <><span className="spinner" style={{ width: 18, height: 18 }} /> Processing...</> : `Place Order — $${total.toFixed(2)}`}
          </button>
        </div>

        {/* Order Summary */}
        <div>
          <div className="card" style={{ padding: 20, position: 'sticky', top: 80 }}>
            <h3 style={{ fontSize: 18, marginBottom: 16 }}>Order Summary</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
              {items.map(item => (
                <div key={item.id} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <img src={item.image_url} alt={item.name} style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 2 }} onError={e => { e.currentTarget.src = `https://picsum.photos/seed/${item.product_id}/48/48`; }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600 }}>{item.name}</p>
                    <p style={{ fontSize: 12, color: 'var(--muted)' }}>Qty: {item.quantity}</p>
                  </div>
                  <span style={{ font: '700 15px "Barlow Condensed"', whiteSpace: 'nowrap' }}>${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div style={{ borderTop: 'var(--border)', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}><span style={{ color: 'var(--muted)' }}>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}><span style={{ color: 'var(--muted)' }}>Tax (7%)</span><span>${tax.toFixed(2)}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 16, marginTop: 4 }}><span>Total</span><span style={{ color: 'var(--accent)' }}>${total.toFixed(2)}</span></div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
