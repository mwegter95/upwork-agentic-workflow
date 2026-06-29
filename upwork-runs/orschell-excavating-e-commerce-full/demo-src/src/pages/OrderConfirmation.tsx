import { useEffect, useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { ordersApi } from '../api/client';
import { useAuth } from '../contexts/AuthContext';

export default function OrderConfirmation() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    ordersApi.get(parseInt(id, 10)).then(r => setOrder(r.data.order)).catch(() => setOrder(null)).finally(() => setLoading(false));
  }, [id]);

  if (!user) return <Navigate to="/login" replace />;
  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><span className="spinner" style={{ width: 36, height: 36 }} /></div>;
  if (!order) return <div className="container" style={{ padding: 60, textAlign: 'center', color: 'var(--muted)' }}><h2>Order not found</h2><Link to="/shop" className="btn" style={{ marginTop: 16, display: 'inline-block' }}>Continue Shopping</Link></div>;

  const addr = order.shipping_address || {};

  return (
    <div className="container" style={{ padding: '60px 20px', maxWidth: 680 }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
        <h1 style={{ fontSize: 40, color: 'var(--success)', marginBottom: 8 }}>Order Confirmed!</h1>
        <p style={{ color: 'var(--muted)', fontSize: 16 }}>Order #{order.id} has been placed successfully.</p>
        <p style={{ fontSize: 13, color: '#555', marginTop: 8, fontStyle: 'italic' }}>Payment Ref: {order.payment_ref}</p>
      </div>

      <div className="card" style={{ padding: 24, marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, marginBottom: 16 }}>Items Ordered</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {(order.items || []).map((item: any) => (
            <div key={item.id} style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              <img src={item.image_url} alt={item.name} style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 2 }} onError={e => { e.currentTarget.src = `https://picsum.photos/seed/${item.product_id}/56/56`; }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 600 }}>{item.name}</p>
                <p style={{ fontSize: 12, color: 'var(--muted)' }}>SKU: {item.sku} &mdash; Qty: {item.quantity}</p>
              </div>
              <span style={{ font: '700 16px "Barlow Condensed"', color: 'var(--accent)' }}>${(item.unit_price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div style={{ borderTop: 'var(--border)', marginTop: 16, paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}><span style={{ color: 'var(--muted)' }}>Subtotal</span><span>${order.subtotal.toFixed(2)}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}><span style={{ color: 'var(--muted)' }}>Tax</span><span>${order.tax.toFixed(2)}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 17 }}><span>Total</span><span style={{ color: 'var(--accent)' }}>${order.total.toFixed(2)}</span></div>
        </div>
      </div>

      <div className="card" style={{ padding: 24, marginBottom: 32 }}>
        <h2 style={{ fontSize: 20, marginBottom: 12 }}>Shipping To</h2>
        <p style={{ fontWeight: 600 }}>{order.shipping_name}</p>
        <p style={{ color: 'var(--muted)', fontSize: 14 }}>{addr.street}, {addr.city}, {addr.state} {addr.zip}</p>
      </div>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
        <Link to="/orders" className="btn btn-outline">View All Orders</Link>
        <Link to="/shop" className="btn">Continue Shopping</Link>
      </div>
    </div>
  );
}
