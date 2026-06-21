import { Router } from 'express';
import { db } from '../db';
import { requireAuth } from '../middleware/auth';
import fetch from 'node-fetch';

const router = Router();

const cache = new Map<string, { data: any; ts: number }>();
const CACHE_TTL = 15 * 60 * 1000; // 15 min — keeps TomTom under 2,500/day free quota

const TOMTOM_KEY = process.env.TOMTOM_API_KEY || '';

// Mock traffic data when no API key — realistic values for demo
function mockTraffic(unitId: string, lat: number, lng: number) {
  const seed = Math.abs(lat * 1000 + lng * 100 + Number(unitId) * 7) % 100;
  const freeFlowSpeed = 45 + (seed % 20);
  const congestion = 15 + (seed % 50);
  const currentSpeed = Math.round(freeFlowSpeed * (1 - congestion / 100));
  return {
    currentSpeed,
    freeFlowSpeed,
    congestionPct: congestion,
    confidence: 0.85,
    roadClosure: false,
    trafficScore: congestion,
    impression_multiplier: (1 + congestion / 200).toFixed(2),
    source: 'mock',
  };
}

router.get('/:unitId', requireAuth, async (req, res) => {
  const { unitId } = req.params;
  const unit = db.prepare('SELECT lat, lng, name FROM ae_inventory WHERE id=?').get(unitId) as any;
  if (!unit) return res.status(404).json({ error: 'Unit not found' });

  const cached = cache.get(unitId);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return res.json(cached.data);
  }

  if (!TOMTOM_KEY) {
    const data = { ...mockTraffic(unitId, unit.lat, unit.lng), unit: { id: unitId, name: unit.name } };
    cache.set(unitId, { data, ts: Date.now() });
    return res.json(data);
  }

  try {
    const url = `https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json` +
      `?point=${unit.lat},${unit.lng}&key=${TOMTOM_KEY}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`TomTom ${response.status}`);
    const raw = await response.json() as any;
    const seg = raw.flowSegmentData || {};
    const freeFlowSpeed = seg.freeFlowSpeed || 45;
    const currentSpeed = seg.currentSpeed || freeFlowSpeed;
    const congestionPct = freeFlowSpeed > 0
      ? Math.max(0, Math.round(((freeFlowSpeed - currentSpeed) / freeFlowSpeed) * 100))
      : 0;

    const data = {
      currentSpeed,
      freeFlowSpeed,
      congestionPct,
      confidence: seg.confidence || 0.9,
      roadClosure: seg.roadClosure || false,
      trafficScore: congestionPct,
      impression_multiplier: (1 + congestionPct / 200).toFixed(2),
      source: 'tomtom',
      unit: { id: unitId, name: unit.name },
    };
    cache.set(unitId, { data, ts: Date.now() });
    return res.json(data);
  } catch (err: any) {
    console.error('[traffic] TomTom fetch failed:', err.message);
    // Fall back to mock on API error
    const data = { ...mockTraffic(unitId, unit.lat, unit.lng), unit: { id: unitId, name: unit.name } };
    cache.set(unitId, { data, ts: Date.now() });
    return res.json(data);
  }
});

// Dashboard endpoint: batch traffic scores for all active inventory
router.get('/', requireAuth, async (req, res) => {
  const units = db.prepare("SELECT id, lat, lng, name FROM ae_inventory WHERE status != 'maintenance'").all() as any[];
  const scores = units.map(u => {
    const cached = cache.get(String(u.id));
    if (cached && Date.now() - cached.ts < CACHE_TTL) return { id: u.id, ...cached.data };
    return { id: u.id, name: u.name, ...mockTraffic(String(u.id), u.lat, u.lng) };
  });
  return res.json({ traffic: scores });
});

export default router;
