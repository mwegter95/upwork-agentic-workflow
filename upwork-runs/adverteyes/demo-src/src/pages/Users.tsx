import React, { useEffect, useState, useCallback } from 'react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import RoleBadge from '../components/RoleBadge';
import { fetchUsers, createUser, updateUser } from '../api';
import { useToast } from '../contexts/ToastContext';
import type { User } from '../api';
import type { Column } from '../components/DataTable';

const COLS: Column<User>[] = [
  { key: 'name', header: 'Full Name' },
  {
    key: 'email', header: 'Email',
    render: (r) => <span className="font-mono" style={{ fontSize: 12 }}>{r.email}</span>,
  },
  { key: 'role', header: 'Role', render: (r) => <RoleBadge role={r.role} /> },
  {
    key: 'active', header: 'Active',
    render: (r) => r.active
      ? <span className="text-success">● Active</span>
      : <span className="text-muted">○ Inactive</span>,
    getValue: (r) => r.active ?? 0,
  },
];

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState<Partial<User & { password?: string }>>({});
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const load = useCallback(() => {
    setLoading(true);
    fetchUsers().then(setUsers).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const openNew = () => { setEditUser({ role: 'sales', active: 1, password: '' }); setShowModal(true); };
  const openEdit = (u: User) => { setEditUser({ ...u, password: '' }); setShowModal(true); };

  const handleSave = async () => {
    if (!editUser.name?.trim() || !editUser.email?.trim()) {
      toast('Name and email are required', 'warn'); return;
    }
    if (!editUser.id && !editUser.password?.trim()) {
      toast('Password is required for new users', 'warn'); return;
    }
    setSaving(true);
    try {
      if (editUser.id) {
        const payload: Partial<User & { password?: string }> = {
          name: editUser.name,
          role: editUser.role,
          active: editUser.active,
        };
        if (editUser.password?.trim()) payload.password = editUser.password;
        await updateUser(editUser.id, payload);
      } else {
        await createUser({
          email: editUser.email!,
          password: editUser.password!,
          name: editUser.name!,
          role: editUser.role!,
        });
      }
      setShowModal(false);
      setEditUser({});
      load();
      toast(editUser.id ? 'User updated' : 'User created', 'success');
    } catch { toast('Save failed . API may be offline', 'error'); }
    finally { setSaving(false); }
  };

  const set = <K extends keyof (User & { password?: string })>(k: K, v: any) =>
    setEditUser((p) => ({ ...p, [k]: v }));

  const roleCounts = users.reduce<Record<string, number>>((acc, u) => {
    acc[u.role] = (acc[u.role] ?? 0) + 1;
    return acc;
  }, {});

  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28 }}>Users</h1>
          <span className="text-muted">{users.length} users (admin access only)</span>
        </div>
        <button className="btn btn-primary" onClick={openNew}>+ Add User</button>
      </div>

      {/* Role summary chips */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        {(['admin', 'sales', 'ops', 'client'] as const).map((role) => (
          <div key={role} className="card" style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <RoleBadge role={role} />
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 20 }}>{roleCounts[role] ?? 0}</span>
            <span className="text-muted text-sm">{role} user{roleCounts[role] !== 1 ? 's' : ''}</span>
          </div>
        ))}
      </div>

      <div className="card">
        <DataTable
          data={users}
          columns={[
            ...COLS,
            {
              key: 'actions',
              header: '',
              sortable: false,
              render: (r) => (
                <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); openEdit(r); }}>
                  Edit
                </button>
              ),
            },
          ]}
          rowKey={(r) => r.id}
        />
      </div>

      {showModal && (
        <Modal
          title={editUser.id ? `Edit User: ${editUser.name}` : 'Add User'}
          onClose={() => { setShowModal(false); setEditUser({}); }}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => { setShowModal(false); setEditUser({}); }}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save User'}
              </button>
            </>
          }
        >
          <div className="form-grid-2">
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Full Name *</label>
              <input className="input" value={editUser.name ?? ''} onChange={(e) => set('name', e.target.value)} />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Email *</label>
              <input
                className="input"
                type="email"
                value={editUser.email ?? ''}
                onChange={(e) => set('email', e.target.value)}
                disabled={!!editUser.id}
                style={editUser.id ? { opacity: 0.5 } : {}}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Role</label>
              <select className="select" value={editUser.role ?? 'sales'} onChange={(e) => set('role', e.target.value)}>
                <option value="admin">Admin</option>
                <option value="sales">Sales</option>
                <option value="ops">Ops</option>
                <option value="client">Client</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="select" value={editUser.active ?? 1} onChange={(e) => set('active', parseInt(e.target.value))}>
                <option value={1}>Active</option>
                <option value={0}>Inactive</option>
              </select>
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">
                {editUser.id ? 'New Password (leave blank to keep current)' : 'Password *'}
              </label>
              <input
                className="input"
                type="password"
                value={editUser.password ?? ''}
                onChange={(e) => set('password', e.target.value)}
                autoComplete="new-password"
                placeholder={editUser.id ? 'Leave blank to keep current' : 'Min 8 characters'}
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
