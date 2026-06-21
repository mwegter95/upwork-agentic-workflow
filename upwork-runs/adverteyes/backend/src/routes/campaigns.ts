import { Router } from 'express';
import { db } from '../db';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth, (req, res) => {
  const { client_id, status } = req.query;
  const user = req.user!;

  let sql = `
    SELECT c.*, cl.name as client_name,
      (SELECT COUNT(*) FROM ae_bookings b WHERE b.campaign_id = c.id AND b.status != 'cancelled') as booking_count,
      (SELECT COALESCE(SUM(b.monthly_rate), 0) FROM ae_bookings b WHERE b.campaign_id = c.id AND b.status != 'cancelled') as booked_value
    FROM ae_campaigns c JOIN ae_clients cl ON c.client_id = cl.id WHERE 1=1
  `;
  const params: any[] = [];

  // Client role: only see their campaigns (client 1 = Ford Dealer)
  if (user.role === 'client') {
    sql += ' AND c.client_id = 1'; // Ford Dealer demo account
  }
  if (client_id) { sql += ' AND c.client_id = ?'; params.push(client_id); }
  if (status)    { sql += ' AND c.status = ?'; params.push(status); }
  sql += ' ORDER BY c.start_date DESC';

  const campaigns = db.prepare(sql).all(...params);
  return res.json({ campaigns });
});

router.get('/:id', requireAuth, (req, res) => {
  const campaign = db.prepare(`
    SELECT c.*, cl.name as client_name, cl.contact, cl.email as client_email
    FROM ae_campaigns c JOIN ae_clients cl ON c.client_id = cl.id WHERE c.id = ?
  `).get(req.params.id) as any;
  if (!campaign) return res.status(404).json({ error: 'Campaign not found' });

  const bookings = db.prepare(`
    SELECT b.*, i.name as unit_name, i.type as unit_type, i.city, i.location_desc
    FROM ae_bookings b JOIN ae_inventory i ON b.unit_id = i.id
    WHERE b.campaign_id = ? AND b.status != 'cancelled'
    ORDER BY b.start_date
  `).all(req.params.id);

  return res.json({ campaign, bookings });
});

router.post('/', requireAuth, requireRole('admin', 'sales'), (req, res) => {
  const { client_id, name, start_date, end_date, budget, status, notes } = req.body;
  if (!client_id || !name || !start_date || !end_date) {
    return res.status(400).json({ error: 'client_id, name, start_date, end_date required' });
  }
  const result = db.prepare(`
    INSERT INTO ae_campaigns (client_id, name, start_date, end_date, budget, status, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(client_id, name, start_date, end_date, budget||0, status||'upcoming', notes||'');
  return res.status(201).json({ id: result.lastInsertRowid });
});

router.put('/:id', requireAuth, requireRole('admin', 'sales'), (req, res) => {
  const { name, start_date, end_date, budget, status, notes } = req.body;
  db.prepare(`
    UPDATE ae_campaigns SET name=?, start_date=?, end_date=?, budget=?, status=?, notes=? WHERE id=?
  `).run(name, start_date, end_date, budget, status, notes||'', req.params.id);
  return res.json({ ok: true });
});

export default router;
