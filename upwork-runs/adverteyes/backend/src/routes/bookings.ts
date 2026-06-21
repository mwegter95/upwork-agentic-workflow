import { Router } from 'express';
import { db } from '../db';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth, (req, res) => {
  const { campaign_id, unit_id, status } = req.query;
  let sql = `
    SELECT b.*, c.name as campaign_name, cl.name as client_name, i.name as unit_name,
           i.type as unit_type, i.city, i.location_desc
    FROM ae_bookings b
    JOIN ae_campaigns c ON b.campaign_id = c.id
    JOIN ae_clients cl ON c.client_id = cl.id
    JOIN ae_inventory i ON b.unit_id = i.id
    WHERE 1=1
  `;
  const params: any[] = [];
  if (campaign_id) { sql += ' AND b.campaign_id = ?'; params.push(campaign_id); }
  if (unit_id)     { sql += ' AND b.unit_id = ?'; params.push(unit_id); }
  if (status)      { sql += ' AND b.status = ?'; params.push(status); }
  sql += ' ORDER BY b.created_at DESC';
  const bookings = db.prepare(sql).all(...params);
  return res.json({ bookings });
});

// Conflict check helper
function checkConflict(unitId: number, startDate: string, endDate: string, excludeId?: number): any {
  let sql = `
    SELECT b.id, b.start_date, b.end_date, c.name as campaign_name
    FROM ae_bookings b JOIN ae_campaigns c ON b.campaign_id = c.id
    WHERE b.unit_id = ? AND b.status NOT IN ('cancelled','completed')
      AND b.start_date < ? AND b.end_date > ?
  `;
  const params: any[] = [unitId, endDate, startDate];
  if (excludeId) { sql += ' AND b.id != ?'; params.push(excludeId); }
  return db.prepare(sql).get(...params);
}

router.post('/check-conflict', requireAuth, (req, res) => {
  const { unit_id, start_date, end_date, exclude_booking_id } = req.body;
  if (!unit_id || !start_date || !end_date) {
    return res.status(400).json({ error: 'unit_id, start_date, end_date required' });
  }
  const conflict = checkConflict(Number(unit_id), start_date, end_date, exclude_booking_id);
  return res.json({
    conflict: !!conflict,
    detail: conflict
      ? `Conflicts with campaign "${conflict.campaign_name}" (${conflict.start_date} to ${conflict.end_date})`
      : null,
  });
});

router.post('/', requireAuth, requireRole('admin', 'sales', 'ops'), (req, res) => {
  const { campaign_id, unit_id, start_date, end_date, monthly_rate, status } = req.body;
  if (!campaign_id || !unit_id || !start_date || !end_date || !monthly_rate) {
    return res.status(400).json({ error: 'campaign_id, unit_id, start_date, end_date, monthly_rate required' });
  }
  const conflict = checkConflict(Number(unit_id), start_date, end_date);
  if (conflict) {
    return res.status(409).json({
      error: 'Booking conflict',
      conflict: true,
      detail: `Conflicts with campaign "${conflict.campaign_name}" (${conflict.start_date} to ${conflict.end_date})`,
    });
  }
  const result = db.prepare(`
    INSERT INTO ae_bookings (campaign_id, unit_id, start_date, end_date, monthly_rate, status, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(campaign_id, unit_id, start_date, end_date, monthly_rate, status||'confirmed', req.user!.userId);

  // Update inventory status if booked
  if ((status||'confirmed') === 'confirmed') {
    db.prepare("UPDATE ae_inventory SET status='booked' WHERE id=?").run(unit_id);
  }

  return res.status(201).json({ id: result.lastInsertRowid, conflict: false });
});

router.put('/:id', requireAuth, requireRole('admin', 'sales'), (req, res) => {
  const { start_date, end_date, monthly_rate, status } = req.body;
  const booking = db.prepare('SELECT * FROM ae_bookings WHERE id=?').get(req.params.id) as any;
  if (!booking) return res.status(404).json({ error: 'Booking not found' });

  if (start_date && end_date) {
    const conflict = checkConflict(booking.unit_id, start_date, end_date, Number(req.params.id));
    if (conflict) {
      return res.status(409).json({
        error: 'Booking conflict',
        conflict: true,
        detail: `Conflicts with campaign "${conflict.campaign_name}"`,
      });
    }
  }
  db.prepare(`
    UPDATE ae_bookings SET start_date=?, end_date=?, monthly_rate=?, status=? WHERE id=?
  `).run(start_date||booking.start_date, end_date||booking.end_date,
         monthly_rate||booking.monthly_rate, status||booking.status, req.params.id);
  return res.json({ ok: true });
});

router.delete('/:id', requireAuth, requireRole('admin'), (req, res) => {
  db.prepare("UPDATE ae_bookings SET status='cancelled' WHERE id=?").run(req.params.id);
  return res.json({ ok: true });
});

export default router;
