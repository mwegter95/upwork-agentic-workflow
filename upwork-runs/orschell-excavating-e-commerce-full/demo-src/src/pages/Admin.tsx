import { useEffect, useState, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { adminApi, productsApi, categoriesApi } from '../api/client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

type Tab = 'dashboard' | 'products' | 'inventory' | 'orders';

const STATUS_COLORS: Record<string, string> = {
  pending: '#F5A623', processing: '#F76B10', shipped: '#3B82F6', delivered: '#27AE60', cancelled: '#E84040',
};

export default function Admin() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('dashboard');

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/" replace />;

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 56px)' }}>
      {/* Sidebar */}
      <div style={{ width: 200, background: '#0D0F12', borderRight: '2px solid var(--accent)', flexShrink: 0 }}>
        <div style={{ padding: '20px 16px', borderBottom: '1px solid #2B2E35' }}>
          <p style={{ font: '700 13px "Barlow Condensed"', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent)' }}>Admin Panel</p>
          <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{user.name}</p>
        </div>
        {([
          ['dashboard', '📊', 'Dashboard'],
          ['products', '📦', 'Products'],
          ['inventory', '🗄', 'Inventory'],
          ['orders', '📋', 'Orders'],
        ] as [Tab, string, string][]).map(([t, icon, label]) => (
          <button key={t} onClick={() => setTab(t)} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '12px 16px', background: tab === t ? 'rgba(247,107,16,0.12)' : 'none', border: 'none', color: tab === t ? 'var(--accent)' : 'var(--muted)', textAlign: 'left', fontSize: 14, fontWeight: 600, borderLeft: tab === t ? '2px solid var(--accent)' : '2px solid transparent', cursor: 'pointer' }}>
            <span>{icon}</span> {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {tab === 'dashboard' && <DashboardPanel />}
        {tab === 'products' && <ProductsPanel />}
        {tab === 'inventory' && <InventoryPanel />}
        {tab === 'orders' && <OrdersPanel />}
      </div>
    </div>
  );
}

// ── Dashboard ──────────────────────────────────────────────────────────────────

function DashboardPanel() {
  const [data, setData] = useState<any>(null);
  useEffect(() => { adminApi.stats().then(r => setData(r.data)).catch(() => {}); }, []);
  if (!data) return <Loader />;
  const { stats, recentOrders, revenueLast7 } = data;

  return (
    <div style={{ padding: 32 }}>
      <h1 style={{ fontSize: 32, marginBottom: 28 }}>Dashboard</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
        {[
          ['Total Revenue', `$${Number(stats.totalRevenue).toFixed(2)}`, 'var(--accent)'],
          ['Total Orders', stats.totalOrders, 'var(--text)'],
          ['Pending', stats.pendingOrders, 'var(--warning)'],
          ['Processing', stats.processingOrders, 'var(--accent)'],
          ['Low Stock', stats.lowStockCount, stats.lowStockCount > 0 ? 'var(--danger)' : 'var(--success)'],
          ['Customers', stats.totalCustomers, 'var(--text)'],
        ].map(([label, value, color]) => (
          <div key={String(label)} className="card" style={{ padding: '18px 20px' }}>
            <p style={{ fontSize: 12, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{label}</p>
            <p style={{ font: `700 28px "Barlow Condensed"`, color: String(color) }}>{value}</p>
          </div>
        ))}
      </div>

      {revenueLast7.length > 0 && (
        <div className="card" style={{ padding: 24, marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, marginBottom: 20 }}>Revenue — Last 7 Days</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={revenueLast7}>
              <XAxis dataKey="date" stroke="#9AA0AB" tick={{ fontSize: 11 }} />
              <YAxis stroke="#9AA0AB" tick={{ fontSize: 11 }} tickFormatter={v => `$${v}`} />
              <Tooltip formatter={(v: number) => [`$${v.toFixed(2)}`, 'Revenue']} contentStyle={{ background: 'var(--bg-card)', border: 'var(--border)', borderRadius: 'var(--radius)' }} />
              <Bar dataKey="revenue" fill="#F76B10" radius={[2,2,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="card" style={{ padding: 24 }}>
        <h2 style={{ fontSize: 18, marginBottom: 16 }}>Recent Orders</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: 'var(--border)', color: 'var(--muted)' }}>
              {['Order', 'Customer', 'Status', 'Total', 'Date'].map(h => <th key={h} style={{ textAlign: 'left', padding: '6px 8px', fontWeight: 600, textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.05em' }}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {recentOrders.map((o: any) => (
              <tr key={o.id} style={{ borderBottom: 'var(--border)' }}>
                <td style={{ padding: '10px 8px', fontWeight: 600 }}>#{o.id}</td>
                <td style={{ padding: '10px 8px', color: 'var(--muted)' }}>{o.customer_name}</td>
                <td style={{ padding: '10px 8px' }}><span style={{ background: STATUS_COLORS[o.status] || '#666', color: '#fff', fontSize: 11, padding: '2px 8px', borderRadius: 2, fontFamily: "'Barlow Condensed'", fontWeight: 700, textTransform: 'uppercase' }}>{o.status}</span></td>
                <td style={{ padding: '10px 8px', font: '700 15px "Barlow Condensed"', color: 'var(--accent)' }}>${Number(o.total).toFixed(2)}</td>
                <td style={{ padding: '10px 8px', color: 'var(--muted)' }}>{new Date(o.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Products ───────────────────────────────────────────────────────────────────

function ProductsPanel() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const load = useCallback(() => {
    productsApi.list({ limit: 50 }).then(r => setProducts(r.data.products || []));
    categoriesApi.list().then(r => setCategories(r.data.categories || []));
  }, []);

  useEffect(() => { load(); }, [load]);

  const blankForm = { category_id: '', name: '', sku: '', price: '', description: '', image_url: '', featured: false, active: true, initial_stock: 0, low_stock_threshold: 5 };
  const [form, setForm] = useState<any>(blankForm);

  function openNew() { setForm(blankForm); setEditing(null); setShowForm(true); }
  function openEdit(p: any) {
    setForm({ category_id: p.category_id, name: p.name, sku: p.sku, price: p.price, description: p.description, image_url: p.image_url, featured: p.featured === 1, active: p.active === 1 });
    setEditing(p); setShowForm(true);
  }

  async function save() {
    setSaving(true); setMsg('');
    try {
      if (editing) { await productsApi.update(editing.id, form); }
      else { await productsApi.create(form); }
      setMsg('Saved!'); setShowForm(false); load();
    } catch (e: any) { setMsg(e.response?.data?.error || 'Error saving'); }
    finally { setSaving(false); }
  }

  async function deactivate(id: number) {
    await productsApi.delete(id);
    load();
  }

  return (
    <div style={{ padding: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontSize: 32 }}>Products</h1>
        <button className="btn" onClick={openNew}>+ New Product</button>
      </div>

      {msg && <p style={{ color: msg === 'Saved!' ? 'var(--success)' : 'var(--danger)', marginBottom: 12 }}>{msg}</p>}

      {showForm && (
        <div className="card" style={{ padding: 24, marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, marginBottom: 20 }}>{editing ? 'Edit Product' : 'New Product'}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label>Category</label>
              <select value={form.category_id} onChange={e => setForm((f: any) => ({ ...f, category_id: e.target.value }))}>
                <option value="">Select category</option>
                {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-group"><label>Product Name</label><input type="text" value={form.name} onChange={e => setForm((f: any) => ({ ...f, name: e.target.value }))} /></div>
            <div className="form-group"><label>SKU</label><input type="text" value={form.sku} onChange={e => setForm((f: any) => ({ ...f, sku: e.target.value }))} /></div>
            <div className="form-group"><label>Price ($)</label><input type="number" step="0.01" min="0" value={form.price} onChange={e => setForm((f: any) => ({ ...f, price: parseFloat(e.target.value) }))} /></div>
            <div className="form-group" style={{ gridColumn: '1/-1' }}><label>Description</label><textarea value={form.description} onChange={e => setForm((f: any) => ({ ...f, description: e.target.value }))} rows={3} /></div>
            <div className="form-group" style={{ gridColumn: '1/-1' }}><label>Image URL</label><input type="text" value={form.image_url} onChange={e => setForm((f: any) => ({ ...f, image_url: e.target.value }))} placeholder="https://..." /></div>
            {!editing && (
              <>
                <div className="form-group"><label>Initial Stock</label><input type="number" min="0" value={form.initial_stock} onChange={e => setForm((f: any) => ({ ...f, initial_stock: parseInt(e.target.value, 10) }))} /></div>
                <div className="form-group"><label>Low-Stock Threshold</label><input type="number" min="0" value={form.low_stock_threshold} onChange={e => setForm((f: any) => ({ ...f, low_stock_threshold: parseInt(e.target.value, 10) }))} /></div>
              </>
            )}
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer' }}><input type="checkbox" checked={form.featured} onChange={e => setForm((f: any) => ({ ...f, featured: e.target.checked }))} /> Featured</label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer' }}><input type="checkbox" checked={form.active} onChange={e => setForm((f: any) => ({ ...f, active: e.target.checked }))} /> Active</label>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button className="btn" onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
            <button className="btn-ghost btn" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--accent)', color: 'var(--muted)' }}>
            {['SKU', 'Name', 'Category', 'Price', 'Stock', 'Status', 'Actions'].map(h => <th key={h} style={{ textAlign: 'left', padding: '8px 10px', fontWeight: 600, textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.05em' }}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {products.map(p => (
            <tr key={p.id} style={{ borderBottom: 'var(--border)' }}>
              <td style={{ padding: '10px', fontFamily: 'monospace', fontSize: 12, color: 'var(--muted)' }}>{p.sku}</td>
              <td style={{ padding: '10px', fontWeight: 600 }}>{p.name}</td>
              <td style={{ padding: '10px', color: 'var(--muted)' }}>{p.category_name}</td>
              <td style={{ padding: '10px', font: '700 15px "Barlow Condensed"', color: 'var(--accent)' }}>${Number(p.price).toFixed(2)}</td>
              <td style={{ padding: '10px' }}>
                <span style={{ color: p.quantity === 0 ? 'var(--danger)' : p.quantity <= p.low_stock_threshold ? 'var(--warning)' : 'var(--success)', fontWeight: 700 }}>{p.quantity}</span>
              </td>
              <td style={{ padding: '10px' }}>
                {p.active === 1 ? <span className="badge badge-success">Active</span> : <span className="badge badge-muted">Inactive</span>}
                {p.featured === 1 && <span className="badge badge-orange" style={{ marginLeft: 4 }}>Featured</span>}
              </td>
              <td style={{ padding: '10px', display: 'flex', gap: 6 }}>
                <button className="btn btn-sm btn-ghost" onClick={() => openEdit(p)}>Edit</button>
                {p.active === 1 && <button className="btn btn-sm btn-danger" onClick={() => deactivate(p.id)}>Deactivate</button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Inventory ──────────────────────────────────────────────────────────────────

function InventoryPanel() {
  const [inventory, setInventory] = useState<any[]>([]);
  const [editing, setEditing] = useState<number | null>(null);
  const [editVals, setEditVals] = useState({ quantity: 0, low_stock_threshold: 5 });
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => { adminApi.inventory().then(r => setInventory(r.data.inventory || [])); }, []);
  useEffect(() => { load(); }, [load]);

  async function save(pid: number) {
    setSaving(true);
    try { await adminApi.updateInventory(pid, editVals); setEditing(null); load(); }
    catch {} finally { setSaving(false); }
  }

  return (
    <div style={{ padding: 32 }}>
      <h1 style={{ fontSize: 32, marginBottom: 24 }}>Inventory</h1>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--accent)', color: 'var(--muted)' }}>
            {['SKU', 'Product', 'Category', 'Stock', 'Low-Stock Threshold', 'Status', 'Actions'].map(h => <th key={h} style={{ textAlign: 'left', padding: '8px 10px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {inventory.map(item => {
            const low = item.quantity <= item.low_stock_threshold;
            const out = item.quantity === 0;
            return (
              <tr key={item.id} style={{ borderBottom: 'var(--border)', background: out ? 'rgba(232,64,64,0.04)' : low ? 'rgba(245,166,35,0.04)' : 'transparent' }}>
                <td style={{ padding: '10px', fontFamily: 'monospace', fontSize: 12, color: 'var(--muted)' }}>{item.sku}</td>
                <td style={{ padding: '10px', fontWeight: 600 }}>{item.name}</td>
                <td style={{ padding: '10px', color: 'var(--muted)' }}>{item.category_name}</td>
                <td style={{ padding: '10px' }}>
                  {editing === item.id
                    ? <input type="number" min="0" value={editVals.quantity} onChange={e => setEditVals(v => ({ ...v, quantity: parseInt(e.target.value, 10) || 0 }))} style={{ width: 80 }} />
                    : <span style={{ color: out ? 'var(--danger)' : low ? 'var(--warning)' : 'var(--success)', fontWeight: 700, fontSize: 16 }}>{item.quantity}</span>
                  }
                </td>
                <td style={{ padding: '10px' }}>
                  {editing === item.id
                    ? <input type="number" min="0" value={editVals.low_stock_threshold} onChange={e => setEditVals(v => ({ ...v, low_stock_threshold: parseInt(e.target.value, 10) || 0 }))} style={{ width: 80 }} />
                    : item.low_stock_threshold
                  }
                </td>
                <td style={{ padding: '10px' }}>
                  {out ? <span className="badge badge-danger">Out of Stock</span> : low ? <span className="badge badge-warning">Low Stock</span> : <span className="badge badge-success">OK</span>}
                </td>
                <td style={{ padding: '10px' }}>
                  {editing === item.id ? (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-sm" onClick={() => save(item.id)} disabled={saving}>Save</button>
                      <button className="btn-ghost btn btn-sm" onClick={() => setEditing(null)}>Cancel</button>
                    </div>
                  ) : (
                    <button className="btn btn-sm btn-ghost" onClick={() => { setEditing(item.id); setEditVals({ quantity: item.quantity, low_stock_threshold: item.low_stock_threshold }); }}>Edit</button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Orders ─────────────────────────────────────────────────────────────────────

function OrdersPanel() {
  const [orders, setOrders] = useState<any[]>([]);
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1 });
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const load = useCallback(() => {
    const params: Record<string, string | number> = { page, limit: 20 };
    if (filter) params.status = filter;
    adminApi.orders(params).then(r => { setOrders(r.data.orders || []); setPagination(r.data.pagination || { totalPages: 1 }); });
  }, [filter, page]);

  useEffect(() => { load(); }, [load]);

  async function updateStatus(id: number, status: string) {
    setUpdatingId(id);
    try { await adminApi.updateOrderStatus(id, status); load(); }
    catch {} finally { setUpdatingId(null); }
  }

  const STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

  return (
    <div style={{ padding: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <h1 style={{ fontSize: 32 }}>Orders</h1>
        <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
          {['', ...STATUSES].map(s => (
            <button key={s} onClick={() => { setFilter(s); setPage(1); }} className={`btn btn-sm ${filter === s ? '' : 'btn-ghost'}`} style={{ textTransform: 'capitalize', fontSize: 12 }}>
              {s || 'All'}
            </button>
          ))}
        </div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--accent)', color: 'var(--muted)' }}>
            {['#', 'Customer', 'Total', 'Status', 'Date', 'Update Status'].map(h => <th key={h} style={{ textAlign: 'left', padding: '8px 10px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {orders.map(o => (
            <tr key={o.id} style={{ borderBottom: 'var(--border)' }}>
              <td style={{ padding: '10px', fontWeight: 700 }}>#{o.id}</td>
              <td style={{ padding: '10px' }}>
                <p style={{ fontWeight: 600 }}>{o.customer_name}</p>
                <p style={{ fontSize: 11, color: 'var(--muted)' }}>{o.customer_email}</p>
              </td>
              <td style={{ padding: '10px', font: '700 16px "Barlow Condensed"', color: 'var(--accent)' }}>${Number(o.total).toFixed(2)}</td>
              <td style={{ padding: '10px' }}>
                <span style={{ background: STATUS_COLORS[o.status] || '#666', color: '#fff', fontSize: 11, padding: '2px 8px', borderRadius: 2, fontFamily: "'Barlow Condensed'", fontWeight: 700, textTransform: 'uppercase' }}>{o.status}</span>
              </td>
              <td style={{ padding: '10px', color: 'var(--muted)' }}>{new Date(o.created_at).toLocaleDateString()}</td>
              <td style={{ padding: '10px' }}>
                <select
                  value={o.status}
                  onChange={e => updateStatus(o.id, e.target.value)}
                  disabled={updatingId === o.id}
                  style={{ fontSize: 12, padding: '4px 6px' }}
                >
                  {STATUSES.map(s => <option key={s} value={s} style={{ textTransform: 'capitalize' }}>{s}</option>)}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {pagination.totalPages > 1 && (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 20 }}>
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)} className={`btn btn-sm ${p === page ? '' : 'btn-ghost'}`}>{p}</button>
          ))}
        </div>
      )}
    </div>
  );
}

function Loader() {
  return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><span className="spinner" style={{ width: 32, height: 32 }} /></div>;
}
