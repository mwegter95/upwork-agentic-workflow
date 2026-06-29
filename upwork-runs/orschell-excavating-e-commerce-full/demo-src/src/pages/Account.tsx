import { useEffect, useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ordersApi } from '../api/client';

const STATUS_COLORS: Record<string, string> = {
  pending: 'var(--warning)', processing: 'var(--accent)', shipped: '#3B82F6', delivered: 'var(--success)', cancelled: 'var(--danger)',
};

export default function Account() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    ordersApi.list().then(r => setOrders(r.data.orders || [])).catch(() => {}).finally(() => setLoading(false));
  }, [user]);

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="container" style={{ padding: '40px 20px', maxWidth: 800 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
        <div style={{ width: 56, height: 56, background: 'var(--accent)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '700 24px "Barlow Condensed"', color: '#fff' }}>
          {user.name[0]?.toUpperCase()}
        </div>
        <div>
          <h1 style={{ fontSize: 28 }}>{user.name}</h1>
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>{user.email}</p>
          {user.role === 'admin' && <span className="badge badge-warning" style={{ marginTop: 4, display: 'inline-block' }}>Admin</span>}
        </div>
      </div>

      <div className="hazard" style={{ marginBottom: 32 }} />

      <h2 style={{ fontSize: 24, marginBottom: 20 }}>Order History</h2>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><span className="spinner" style={{ width: 28, height: 28 }} /></div>
      ) : orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--muted)' }}>
          <p style={{ marginBottom: 16 }}>No orders yet.</p>
          <Link to="/shop" className="btn">Start Shopping</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {orders.map(order => (
            <Link key={order.id} to={`/orders/${order.id}`} style={{ display: 'block' }}>
              <div className="card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 20 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <p style={{ fontWeight: 700, fontSize: 15 }}>Order #{order.id}</p>
                    <span style={{ background: STATUS_COLORS[order.status] || '#666', color: order.status === 'processing' ? '#fff' : order.status === 'pending' ? '#000' : '#fff', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 2, fontFamily: "'Barlow Condensed'", textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {order.status}
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--muted)' }}>{new Date(order.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ font: '700 20px "Barlow Condensed"', color: 'var(--accent)' }}>${order.total.toFixed(2)}</p>
                  <p style={{ fontSize: 12, color: 'var(--muted)' }}>View Details →</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
