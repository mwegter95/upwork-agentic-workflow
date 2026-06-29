import { useEffect, useState } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ordersApi } from '../api/client';

const STATUS_COLORS: Record<string, string> = {
  pending: '#F5A623', processing: '#F76B10', shipped: '#3B82F6', delivered: '#27AE60', cancelled: '#E84040',
};

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    ordersApi.get(parseInt(id, 10)).then(r => setOrder(r.data.order)).catch(() => setOrder(null)).finally(() => setLoading(false));
  }, [id]);

  if (!user) return <Navigate to="/login" replace />;
  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><span className="spinner" style={{ width: 32, height: 32 }} /></div>;
  if (!order) return <div className="container" style={{ padding: 60, textAlign: 'center', color: 'var(--muted)' }}><h2>Order not found</h2><Link to="/account" className="btn" style={{ marginTop: 16, display: 'inline-block' }}>My Account</Link></div>;

  const addr = order.shipping_address || {};
  const statusColor = STATUS_COLORS[order.status] || '#666';

  return (
    <div className="container" style={{ padding: '40px 20px', maxWidth: 760 }}>
      <div style={{ marginBottom: 24 }}>
        <Link to="/account" style={{ color: 'var(--muted)', fontSize: 13 }}>← Back to Account</Link>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
        <h1 style={{ fontSize: 32 }}>Order #{order.id}</h1>
        <span style={{ background: statusColor, color: order.status === 'pending' ? '#000' : '#fff', fontFamily: "'Barlow Condensed'", fontWeight: 700, fontSize: 13, textTransform: 'uppercase', padding: '3px 12px', borderRadius: 2 }}>{order.status}</span>
      </div>

      {/* Status pipeline */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 32 }}>
        {['pending','processing','shipped','delivered'].map((s, i) => {
          const statuses = ['pending','processing','shipped','delivered'];
          const currentIdx = statuses.indexOf(order.status);
          const done = i <= currentIdx && order.status !== 'cancelled';
          return (
            <div key={s} style={{ display: 'flex', alignItems: 'center', flex: i < 3 ? 1 : undefined }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: done ? 'var(--accent)' : 'var(--bg-card)', border: done ? '2px solid var(--accent)' : 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 4px', fontSize: 16 }}>
                  {done ? '✓' : '○'}
                </div>
                <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: done ? 'var(--text)' : 'var(--muted)', fontWeight: done ? 600 : 400 }}>{s}</p>
              </div>
              {i < 3 && <div style={{ flex: 1, height: 2, background: done && i < currentIdx ? 'var(--accent)' : '#3E434D', margin: '0 4px 18px' }} />}
            </div>
          );
        })}
      </div>

      <div className="card" style={{ padding: 24, marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, marginBottom: 16 }}>Items</h2>
        {(order.items || []).map((item: any) => (
          <div key={item.id} style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 14, paddingBottom: 14, borderBottom: 'var(--border)' }}>
            <img src={item.image_url} alt={item.name} style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 2 }} onError={e => { e.currentTarget.src = `https://picsum.photos/seed/${item.product_id}/60/60`; }} />
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 600 }}>{item.name}</p>
              <p style={{ fontSize: 12, color: 'var(--muted)' }}>SKU: {item.sku} &bull; Qty: {item.quantity} &bull; ${Number(item.unit_price).toFixed(2)} each</p>
            </div>
            <span style={{ font: '700 17px "Barlow Condensed"', color: 'var(--accent)' }}>${(item.unit_price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end', fontSize: 14 }}>
          <div style={{ display: 'flex', gap: 40 }}><span style={{ color: 'var(--muted)' }}>Subtotal</span><span>${Number(order.subtotal).toFixed(2)}</span></div>
          <div style={{ display: 'flex', gap: 40 }}><span style={{ color: 'var(--muted)' }}>Tax</span><span>${Number(order.tax).toFixed(2)}</span></div>
          <div style={{ display: 'flex', gap: 40, fontWeight: 700, fontSize: 17 }}><span>Total</span><span style={{ color: 'var(--accent)' }}>${Number(order.total).toFixed(2)}</span></div>
        </div>
      </div>

      <div className="card" style={{ padding: 24 }}>
        <h2 style={{ fontSize: 20, marginBottom: 12 }}>Shipping</h2>
        <p style={{ fontWeight: 600 }}>{order.shipping_name}</p>
        <p style={{ color: 'var(--muted)', fontSize: 14 }}>{addr.street}, {addr.city}, {addr.state} {addr.zip}</p>
        <p style={{ fontSize: 12, color: '#555', marginTop: 8 }}>Payment ref: {order.payment_ref}</p>
      </div>
    </div>
  );
}
