import { Router } from 'express';
import * as bcrypt from 'bcryptjs';
import { db } from '../db';
import { makeToken, requireAuth } from '../middleware/auth';

const router = Router();

router.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password required' });
  }
  const user = db.prepare('SELECT * FROM ae_users WHERE email = ? AND active = 1').get(email.toLowerCase().trim()) as any;
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  const payload = { userId: user.id, email: user.email, name: user.name, role: user.role };
  return res.json({ token: makeToken(payload), user: { id: user.id, email: user.email, name: user.name, role: user.role } });
});

router.get('/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT id, email, name, role FROM ae_users WHERE id = ?').get(req.user!.userId) as any;
  if (!user) return res.status(404).json({ error: 'User not found' });
  return res.json({ user });
});

export default router;
