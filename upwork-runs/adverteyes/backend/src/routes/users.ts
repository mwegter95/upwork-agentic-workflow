import { Router } from 'express';
import * as bcrypt from 'bcryptjs';
import { db } from '../db';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

// Admin only — all endpoints
router.use(requireAuth, requireRole('admin'));

router.get('/', (req, res) => {
  const users = db.prepare('SELECT id, email, name, role, active, created_at FROM ae_users ORDER BY created_at').all();
  return res.json({ users });
});

router.post('/', (req, res) => {
  const { email, password, name, role } = req.body;
  if (!email || !password || !name || !role) {
    return res.status(400).json({ error: 'email, password, name, role required' });
  }
  const validRoles = ['admin', 'sales', 'ops', 'client'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ error: `role must be one of: ${validRoles.join(', ')}` });
  }
  try {
    const result = db.prepare(
      'INSERT INTO ae_users (email, password_hash, name, role) VALUES (?, ?, ?, ?)'
    ).run(email.toLowerCase().trim(), bcrypt.hashSync(password, 10), name, role);
    return res.status(201).json({ id: result.lastInsertRowid });
  } catch (err: any) {
    if (err.message?.includes('UNIQUE')) return res.status(409).json({ error: 'Email already exists' });
    throw err;
  }
});

router.put('/:id', (req, res) => {
  const { name, role, active, password } = req.body;
  const user = db.prepare('SELECT * FROM ae_users WHERE id=?').get(req.params.id) as any;
  if (!user) return res.status(404).json({ error: 'User not found' });

  if (password) {
    db.prepare('UPDATE ae_users SET password_hash=? WHERE id=?').run(bcrypt.hashSync(password, 10), req.params.id);
  }
  db.prepare('UPDATE ae_users SET name=?, role=?, active=? WHERE id=?').run(
    name||user.name, role||user.role, active !== undefined ? (active ? 1 : 0) : user.active, req.params.id
  );
  return res.json({ ok: true });
});

export default router;
