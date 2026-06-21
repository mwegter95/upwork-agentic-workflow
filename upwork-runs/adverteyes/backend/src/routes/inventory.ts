import { Router } from 'express';
import { db } from '../db';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth, (req, res) => {
  const { type, status, search } = req.query;
  let sql = 'SELECT * FROM ae_inventory WHERE 1=1';
  const params: any[] = [];
  if (type)   { sql += ' AND type = ?'; params.push(type); }
  if (status) { sql += ' AND status = ?'; params.push(status); }
  if (search) { sql += ' AND (name LIKE ? OR location_desc LIKE ? OR city LIKE ?)';
    const s = `%${search}%`; params.push(s, s, s); }
  sql += ' ORDER BY type, name';
  const rows = db.prepare(sql).all(...params);
  return res.json({ inventory: rows });
});

router.get('/:id', requireAuth, (req, res) => {
  const unit = db.prepare('SELECT * FROM ae_inventory WHERE id = ?').get(req.params.id) as any;
  if (!unit) return res.status(404).json({ error: 'Unit not found' });
  // Attach active bookings
  const bookings = db.prepare(`
    SELECT b.*, c.name as campaign_name, cl.name as client_name
    FROM ae_bookings b
    JOIN ae_campaigns c ON b.campaign_id = c.id
    JOIN ae_clients cl ON c.client_id = cl.id
    WHERE b.unit_id = ? AND b.status != 'cancelled'
    ORDER BY b.start_date
  `).all(req.params.id);
  return res.json({ unit, bookings });
});

router.post('/', requireAuth, requireRole('admin', 'sales'), (req, res) => {
  const { name, type, subtype, location_desc, city, state, lat, lng, width_ft, height_ft,
          illuminated, digital, monthly_rate, weekly_impressions, status, notes } = req.body;
  if (!name || !type || !lat || !lng || !monthly_rate) {
    return res.status(400).json({ error: 'name, type, lat, lng, monthly_rate required' });
  }
  const result = db.prepare(`
    INSERT INTO ae_inventory (name, type, subtype, location_desc, city, state, lat, lng,
      width_ft, height_ft, illuminated, digital, monthly_rate, weekly_impressions, status, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(name, type, subtype||'', location_desc||'', city||'', state||'FL',
         lat, lng, width_ft||14, height_ft||48, illuminated?1:0, digital?1:0,
         monthly_rate, weekly_impressions||0, status||'available', notes||'');
  return res.status(201).json({ id: result.lastInsertRowid });
});

router.put('/:id', requireAuth, requireRole('admin'), (req, res) => {
  const unit = db.prepare('SELECT id FROM ae_inventory WHERE id = ?').get(req.params.id);
  if (!unit) return res.status(404).json({ error: 'Unit not found' });
  const { name, type, subtype, location_desc, city, state, lat, lng, width_ft, height_ft,
          illuminated, digital, monthly_rate, weekly_impressions, status, notes } = req.body;
  db.prepare(`
    UPDATE ae_inventory SET name=?, type=?, subtype=?, location_desc=?, city=?, state=?, lat=?, lng=?,
      width_ft=?, height_ft=?, illuminated=?, digital=?, monthly_rate=?, weekly_impressions=?, status=?, notes=?
    WHERE id = ?
  `).run(name, type, subtype||'', location_desc||'', city||'', state||'FL',
         lat, lng, width_ft, height_ft, illuminated?1:0, digital?1:0,
         monthly_rate, weekly_impressions, status, notes||'', req.params.id);
  return res.json({ ok: true });
});

router.delete('/:id', requireAuth, requireRole('admin'), (req, res) => {
  db.prepare('DELETE FROM ae_inventory WHERE id = ?').run(req.params.id);
  return res.json({ ok: true });
});

export default router;
