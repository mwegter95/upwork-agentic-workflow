import { Router } from 'express';
import { db } from '../db';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth, (req, res) => {
  const clients = db.prepare('SELECT * FROM ae_clients ORDER BY name').all();
  return res.json({ clients });
});

router.post('/', requireAuth, requireRole('admin', 'sales'), (req, res) => {
  const { name, contact, email, phone, industry } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  const result = db.prepare(
    'INSERT INTO ae_clients (name, contact, email, phone, industry) VALUES (?, ?, ?, ?, ?)'
  ).run(name, contact||'', email||'', phone||'', industry||'');
  return res.status(201).json({ id: result.lastInsertRowid });
});

export default router;
