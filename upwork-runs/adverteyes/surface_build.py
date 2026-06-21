#!/usr/bin/env python3
"""
Surface build script for adverteyes-api Node/TS backend.
Run via: python scripts/surface_run.py --lang python --file upwork-runs/adverteyes/surface_build.py
"""
import os, subprocess, sys, json
from pathlib import Path

WORKSPACE = Path("adverteyes-api")
WORKSPACE.mkdir(parents=True, exist_ok=True)

SRC = WORKSPACE / "src"
MIDDLEWARE = SRC / "middleware"
ROUTES = SRC / "routes"
DATA = WORKSPACE / "data"
for d in [SRC, MIDDLEWARE, ROUTES, DATA]:
    d.mkdir(parents=True, exist_ok=True)

def w(path, content):
    Path(path).write_text(content, encoding="utf-8")
    print(f"  wrote {path}")

# ?? package.json ??????????????????????????????????????????????????????????????
w(WORKSPACE / "package.json", json.dumps({
  "name": "adverteyes-api",
  "version": "1.0.0",
  "main": "dist/index.js",
  "scripts": {"build": "tsc", "start": "node dist/index.js"},
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "better-sqlite3": "^9.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "jsonwebtoken": "^9.0.2",
    "node-fetch": "^2.7.0"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/better-sqlite3": "^7.6.10",
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/jsonwebtoken": "^9.0.6",
    "@types/node": "^20.12.7",
    "@types/node-fetch": "^2.6.11",
    "typescript": "^5.4.5"
  }
}, indent=2))

# ?? tsconfig.json ?????????????????????????????????????????????????????????????
w(WORKSPACE / "tsconfig.json", json.dumps({
  "compilerOptions": {
    "target": "ES2020", "module": "commonjs", "moduleResolution": "node",
    "outDir": "./dist", "rootDir": "./src", "strict": True,
    "esModuleInterop": True, "skipLibCheck": True, "resolveJsonModule": True
  },
  "include": ["src/**/*"], "exclude": ["node_modules", "dist"]
}, indent=2))

# ?? .env ?????????????????????????????????????????????????????????????????????
env_path = WORKSPACE / ".env"
if not env_path.exists():
    w(env_path, "PORT=3741\nJWT_SECRET=adverteyes-prod-secret-2026\n# TOMTOM_API_KEY=your_key_here\n")

# ?? src/db.ts ?????????????????????????????????????????????????????????????????
w(SRC / "db.ts", r"""
import Database from 'better-sqlite3';
import * as bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';

const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
const DB_PATH = path.join(DATA_DIR, 'adverteyes.db');
export const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS ae_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL, name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'ops', active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS ae_clients (
  id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL,
  contact TEXT NOT NULL DEFAULT '', email TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '', industry TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS ae_inventory (
  id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, type TEXT NOT NULL,
  subtype TEXT NOT NULL DEFAULT '', location_desc TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT '', state TEXT NOT NULL DEFAULT 'FL',
  lat REAL NOT NULL, lng REAL NOT NULL,
  width_ft REAL NOT NULL DEFAULT 14, height_ft REAL NOT NULL DEFAULT 48,
  illuminated INTEGER NOT NULL DEFAULT 0, digital INTEGER NOT NULL DEFAULT 0,
  monthly_rate REAL NOT NULL, weekly_impressions INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'available', notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS ae_campaigns (
  id INTEGER PRIMARY KEY AUTOINCREMENT, client_id INTEGER NOT NULL REFERENCES ae_clients(id),
  name TEXT NOT NULL, start_date TEXT NOT NULL, end_date TEXT NOT NULL,
  budget REAL NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'upcoming',
  notes TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS ae_bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT, campaign_id INTEGER NOT NULL REFERENCES ae_campaigns(id),
  unit_id INTEGER NOT NULL REFERENCES ae_inventory(id),
  start_date TEXT NOT NULL, end_date TEXT NOT NULL, monthly_rate REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed', created_by INTEGER REFERENCES ae_users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS ae_activity (
  id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER REFERENCES ae_users(id),
  action TEXT NOT NULL, entity TEXT NOT NULL DEFAULT '', entity_id INTEGER,
  detail TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`);

const userCount = (db.prepare('SELECT COUNT(*) as c FROM ae_users').get() as any).c;
if (userCount === 0) {
  console.log('[db] Seeding...');
  const iu = db.prepare('INSERT INTO ae_users (email,password_hash,name,role) VALUES (?,?,?,?)');
  iu.run('admin@adverteyes.com', bcrypt.hashSync('Admin123!',10), 'Alex Rivera','admin');
  iu.run('sarah@adverteyes.com', bcrypt.hashSync('Sales123!',10), 'Sarah Chen','sales');
  iu.run('ops@adverteyes.com',   bcrypt.hashSync('Ops1234!',10),  'Marcus Johnson','ops');
  iu.run('client@forddealer.com',bcrypt.hashSync('Client12!',10), 'Ford Dealer Rep','client');

  const ic = db.prepare('INSERT INTO ae_clients (name,contact,email,phone,industry) VALUES (?,?,?,?,?)');
  ic.run('Ford Dealer Group Tampa','Jim Patterson','jim@fordtampa.com','813-555-0101','Automotive');
  ic.run('Metro Health Network','Dr. Lisa Wu','lisa@metrohealth.com','813-555-0202','Healthcare');
  ic.run('Pepsi Regional Southeast','Carlos Reyes','creyes@pepsi.com','813-555-0303','CPG');
  ic.run('Coastal Credit Union','Amanda Brooks','abrooks@coastalcu.com','813-555-0404','Finance');
  ic.run('FitCore Gym','Ryan Torres','ryan@fitcore.com','813-555-0505','Fitness');

  const ii = db.prepare(`INSERT INTO ae_inventory
    (name,type,subtype,location_desc,city,state,lat,lng,width_ft,height_ft,illuminated,digital,monthly_rate,weekly_impressions,status)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
  ii.run('I-275 North Gateway','billboard','highway','I-275 at Bearss Ave overpass','Tampa','FL',28.0854,-82.4374,14,48,1,0,4200,55000,'booked');
  ii.run('I-4 West Corridor','billboard','highway','I-4 @ Mango Rd exit, westbound','Tampa','FL',27.9834,-82.3521,14,48,1,0,3900,48000,'available');
  ii.run('Dale Mabry & Kennedy','billboard','arterial','SW corner, facing north','Tampa','FL',27.9472,-82.5020,10,36,1,0,2800,38000,'booked');
  ii.run('US-19 Clearwater North','billboard','arterial','US-19 & Sunset Point Rd','Clearwater','FL',27.9975,-82.7468,10,36,1,0,2600,34000,'available');
  ii.run('Gandy Blvd Bridge Approach','billboard','arterial','Gandy Blvd W, westbound approach','Tampa','FL',27.8991,-82.5340,10,36,0,0,2200,30000,'available');
  ii.run('SR-60 Brandon Corridor','billboard','suburban','SR-60 at Falkenburg Rd','Brandon','FL',27.9337,-82.3147,14,48,0,0,1900,26000,'maintenance');
  ii.run('Hillsborough Ave & Armenia','billboard','arterial','NW corner, facing east','Tampa','FL',27.9808,-82.4839,10,36,1,0,2400,31000,'booked');
  ii.run('US-41 South Tampa','billboard','arterial','US-41 & Macdill Ave intersection','Tampa','FL',27.9020,-82.5164,10,36,1,0,2700,36000,'available');
  ii.run('Channelside Bay Plaza Digital','dooh','mall','Channelside Dr, main entrance','Tampa','FL',27.9435,-82.4521,12,20,1,1,8500,180000,'booked');
  ii.run('Westshore Mall Atrium','dooh','mall','Westshore Mall center court','Tampa','FL',27.9533,-82.5257,8,14,1,1,6200,95000,'available');
  ii.run('Amalie Arena North Facade','dooh','stadium','Channelside Dr, arena north','Tampa','FL',27.9428,-82.4512,20,30,1,1,11000,220000,'booked');
  ii.run("Tampa Int'l Airport Arrivals",'dooh','transit','TIA Terminal F arrivals hall','Tampa','FL',27.9763,-82.5326,10,16,1,1,9500,160000,'available');
  ii.run('Ybor City 7th Ave Strip','dooh','entertainment','7th Ave between 15th-17th St','Tampa','FL',27.9594,-82.4381,8,12,1,1,5800,88000,'available');
  ii.run('Clearwater Beach Boardwalk','dooh','entertainment','Pier 60 Park entrance','Clearwater','FL',27.9774,-82.8274,10,18,1,1,7200,120000,'booked');
  ii.run('City Route Alpha - Tampa Core','truckside','city','Covers downtown Tampa daily route','Tampa','FL',27.9506,-82.4572,8,16,0,0,3200,28000,'available');
  ii.run('City Route Beta - Pinellas','truckside','city','St. Pete / Clearwater daily loop','St. Petersburg','FL',27.7676,-82.6393,8,16,0,0,2900,24000,'booked');
  ii.run('Suburban Route Gamma - Brandon','truckside','suburban','Brandon to Riverview daily','Brandon','FL',27.9374,-82.3050,8,16,0,0,2100,19000,'available');
  ii.run('Suburban Route Delta - Northdale','truckside','suburban','Wesley Chapel to Carrollwood','Tampa','FL',28.1027,-82.5190,8,16,0,0,1900,17000,'available');
  ii.run('University Area Route - USF','truckside','university','USF campus loop + Fowler Ave','Tampa','FL',28.0622,-82.4142,8,16,0,0,2300,22000,'available');
  ii.run('Port Tampa Route - Industrial','truckside','industrial','Port Tampa Bay industrial corridor','Tampa','FL',27.8618,-82.5562,8,16,0,0,1600,14000,'booked');

  const icamp = db.prepare('INSERT INTO ae_campaigns (client_id,name,start_date,end_date,budget,status) VALUES (?,?,?,?,?,?)');
  icamp.run(1,'Ford Summer Sales Event','2026-06-01','2026-08-31',85000,'active');
  icamp.run(2,'Metro Health Back to School','2026-08-01','2026-09-30',42000,'upcoming');
  icamp.run(3,'Pepsi Summer Refresh','2026-05-15','2026-07-31',120000,'active');
  icamp.run(4,'Coastal CU Home Loan Push','2026-06-15','2026-09-15',55000,'active');
  icamp.run(5,'FitCore New Year Push','2026-01-01','2026-03-31',28000,'completed');
  icamp.run(1,'Ford F-150 Launch','2026-10-01','2026-12-31',95000,'upcoming');
  icamp.run(3,'Pepsi Football Season','2026-09-01','2026-12-15',140000,'upcoming');
  icamp.run(2,'Metro Health Open Enrollment','2026-10-15','2026-11-30',38000,'upcoming');

  const ib = db.prepare('INSERT INTO ae_bookings (campaign_id,unit_id,start_date,end_date,monthly_rate,status,created_by) VALUES (?,?,?,?,?,?,?)');
  ib.run(1,1,'2026-06-01','2026-08-31',4200,'confirmed',1);
  ib.run(1,3,'2026-06-01','2026-08-31',2800,'confirmed',1);
  ib.run(1,7,'2026-06-01','2026-08-31',2400,'confirmed',2);
  ib.run(3,9,'2026-05-15','2026-07-31',8500,'confirmed',2);
  ib.run(3,11,'2026-05-15','2026-07-31',11000,'confirmed',2);
  ib.run(3,14,'2026-05-15','2026-07-31',7200,'confirmed',2);
  ib.run(3,17,'2026-05-15','2026-07-31',2900,'confirmed',1);
  ib.run(3,20,'2026-05-15','2026-07-31',1600,'confirmed',1);
  ib.run(4,8,'2026-06-15','2026-09-15',2700,'confirmed',2);
  ib.run(4,12,'2026-06-15','2026-09-15',9500,'confirmed',2);
  ib.run(4,16,'2026-06-15','2026-09-15',3200,'confirmed',1);
  ib.run(5,19,'2026-01-01','2026-03-31',2300,'completed',1);
  ib.run(2,2,'2026-08-01','2026-09-30',3900,'confirmed',2);
  ib.run(1,3,'2026-09-01','2026-11-30',2800,'pending',2);
  ib.run(1,18,'2026-06-01','2026-08-31',1900,'confirmed',1);

  const ia = db.prepare('INSERT INTO ae_activity (user_id,action,entity,entity_id,detail) VALUES (?,?,?,?,?)');
  ia.run(1,'created','campaign',1,'Ford Summer Sales Event campaign created');
  ia.run(2,'booked','inventory',1,'I-275 North Gateway booked for Ford Summer');
  ia.run(2,'booked','inventory',9,'Channelside Bay Plaza Digital booked for Pepsi');
  ia.run(1,'updated','campaign',3,'Pepsi Summer Refresh budget updated to $120k');
  ia.run(3,'checked','inventory',6,'SR-60 Brandon set to maintenance');
  ia.run(2,'created','campaign',4,'Coastal CU Home Loan Push campaign created');
  ia.run(1,'approved','booking',4,'Pepsi Channelside booking approved');
  ia.run(2,'booked','inventory',12,'TIA Airport digital booked for Coastal CU');
  console.log('[db] Seed complete.');
}
""".strip())

# ?? src/middleware/auth.ts ????????????????????????????????????????????????????
w(MIDDLEWARE / "auth.ts", r"""
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db';
const JWT_SECRET = process.env.JWT_SECRET || 'adverteyes-dev-secret';
export interface AuthPayload { userId: number; email: string; name: string; role: string; }
declare global { namespace Express { interface Request { user?: AuthPayload; } } }
export function makeToken(p: AuthPayload) { return jwt.sign(p, JWT_SECRET, { expiresIn: '7d' }); }
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) { res.status(401).json({ error: 'Authentication required' }); return; }
  try {
    const payload = jwt.verify(auth.slice(7), JWT_SECRET) as AuthPayload;
    const user = db.prepare('SELECT active FROM ae_users WHERE id=?').get(payload.userId) as any;
    if (!user?.active) { res.status(401).json({ error: 'Account inactive' }); return; }
    req.user = payload; next();
  } catch { res.status(401).json({ error: 'Invalid or expired token' }); }
}
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) { res.status(401).json({ error: 'Auth required' }); return; }
    if (!roles.includes(req.user.role)) { res.status(403).json({ error: `Requires: ${roles.join(' or ')}` }); return; }
    next();
  };
}
""".strip())

# ?? src/routes/auth.ts ????????????????????????????????????????????????????????
w(ROUTES / "auth.ts", r"""
import { Router } from 'express';
import * as bcrypt from 'bcryptjs';
import { db } from '../db';
import { makeToken, requireAuth } from '../middleware/auth';
const router = Router();
router.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  const user = db.prepare('SELECT * FROM ae_users WHERE email=? AND active=1').get(email.toLowerCase().trim()) as any;
  if (!user || !bcrypt.compareSync(password, user.password_hash)) return res.status(401).json({ error: 'Invalid email or password' });
  const payload = { userId: user.id, email: user.email, name: user.name, role: user.role };
  return res.json({ token: makeToken(payload), user: { id: user.id, email: user.email, name: user.name, role: user.role } });
});
router.get('/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT id,email,name,role FROM ae_users WHERE id=?').get(req.user!.userId) as any;
  return res.json({ user });
});
export default router;
""".strip())

# ?? src/routes/inventory.ts ???????????????????????????????????????????????????
w(ROUTES / "inventory.ts", r"""
import { Router } from 'express';
import { db } from '../db';
import { requireAuth, requireRole } from '../middleware/auth';
const router = Router();
router.get('/', requireAuth, (req, res) => {
  const { type, status, search } = req.query;
  let sql = 'SELECT * FROM ae_inventory WHERE 1=1'; const p: any[] = [];
  if (type) { sql += ' AND type=?'; p.push(type); }
  if (status) { sql += ' AND status=?'; p.push(status); }
  if (search) { sql += ' AND (name LIKE ? OR location_desc LIKE ? OR city LIKE ?)'; const s=`%${search}%`; p.push(s,s,s); }
  sql += ' ORDER BY type,name';
  return res.json({ inventory: db.prepare(sql).all(...p) });
});
router.get('/:id', requireAuth, (req, res) => {
  const unit = db.prepare('SELECT * FROM ae_inventory WHERE id=?').get(req.params.id) as any;
  if (!unit) return res.status(404).json({ error: 'Unit not found' });
  const bookings = db.prepare(`SELECT b.*,c.name as campaign_name,cl.name as client_name FROM ae_bookings b JOIN ae_campaigns c ON b.campaign_id=c.id JOIN ae_clients cl ON c.client_id=cl.id WHERE b.unit_id=? AND b.status!='cancelled' ORDER BY b.start_date`).all(req.params.id);
  return res.json({ unit, bookings });
});
router.post('/', requireAuth, requireRole('admin','sales'), (req, res) => {
  const { name,type,subtype,location_desc,city,state,lat,lng,width_ft,height_ft,illuminated,digital,monthly_rate,weekly_impressions,status,notes } = req.body;
  if (!name||!type||!lat||!lng||!monthly_rate) return res.status(400).json({ error: 'name,type,lat,lng,monthly_rate required' });
  const r = db.prepare(`INSERT INTO ae_inventory (name,type,subtype,location_desc,city,state,lat,lng,width_ft,height_ft,illuminated,digital,monthly_rate,weekly_impressions,status,notes) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(name,type,subtype||'',location_desc||'',city||'',state||'FL',lat,lng,width_ft||14,height_ft||48,illuminated?1:0,digital?1:0,monthly_rate,weekly_impressions||0,status||'available',notes||'');
  return res.status(201).json({ id: r.lastInsertRowid });
});
router.put('/:id', requireAuth, requireRole('admin'), (req, res) => {
  const { name,type,subtype,location_desc,city,state,lat,lng,width_ft,height_ft,illuminated,digital,monthly_rate,weekly_impressions,status,notes } = req.body;
  db.prepare(`UPDATE ae_inventory SET name=?,type=?,subtype=?,location_desc=?,city=?,state=?,lat=?,lng=?,width_ft=?,height_ft=?,illuminated=?,digital=?,monthly_rate=?,weekly_impressions=?,status=?,notes=? WHERE id=?`).run(name,type,subtype||'',location_desc||'',city||'',state||'FL',lat,lng,width_ft,height_ft,illuminated?1:0,digital?1:0,monthly_rate,weekly_impressions,status,notes||'',req.params.id);
  return res.json({ ok: true });
});
router.delete('/:id', requireAuth, requireRole('admin'), (req, res) => {
  db.prepare('DELETE FROM ae_inventory WHERE id=?').run(req.params.id); return res.json({ ok: true });
});
export default router;
""".strip())

# ?? src/routes/clients.ts ?????????????????????????????????????????????????????
w(ROUTES / "clients.ts", r"""
import { Router } from 'express';
import { db } from '../db';
import { requireAuth, requireRole } from '../middleware/auth';
const router = Router();
router.get('/', requireAuth, (req, res) => res.json({ clients: db.prepare('SELECT * FROM ae_clients ORDER BY name').all() }));
router.post('/', requireAuth, requireRole('admin','sales'), (req, res) => {
  const { name,contact,email,phone,industry } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  const r = db.prepare('INSERT INTO ae_clients (name,contact,email,phone,industry) VALUES (?,?,?,?,?)').run(name,contact||'',email||'',phone||'',industry||'');
  return res.status(201).json({ id: r.lastInsertRowid });
});
export default router;
""".strip())

# ?? src/routes/campaigns.ts ???????????????????????????????????????????????????
w(ROUTES / "campaigns.ts", r"""
import { Router } from 'express';
import { db } from '../db';
import { requireAuth, requireRole } from '../middleware/auth';
const router = Router();
router.get('/', requireAuth, (req, res) => {
  const { client_id, status } = req.query;
  const user = req.user!;
  let sql = `SELECT c.*,cl.name as client_name,(SELECT COUNT(*) FROM ae_bookings b WHERE b.campaign_id=c.id AND b.status!='cancelled') as booking_count,(SELECT COALESCE(SUM(b.monthly_rate),0) FROM ae_bookings b WHERE b.campaign_id=c.id AND b.status!='cancelled') as booked_value FROM ae_campaigns c JOIN ae_clients cl ON c.client_id=cl.id WHERE 1=1`;
  const p: any[] = [];
  if (user.role==='client') { sql += ' AND c.client_id=1'; }
  if (client_id) { sql += ' AND c.client_id=?'; p.push(client_id); }
  if (status)    { sql += ' AND c.status=?'; p.push(status); }
  sql += ' ORDER BY c.start_date DESC';
  return res.json({ campaigns: db.prepare(sql).all(...p) });
});
router.get('/:id', requireAuth, (req, res) => {
  const campaign = db.prepare(`SELECT c.*,cl.name as client_name,cl.contact,cl.email as client_email FROM ae_campaigns c JOIN ae_clients cl ON c.client_id=cl.id WHERE c.id=?`).get(req.params.id);
  if (!campaign) return res.status(404).json({ error: 'Not found' });
  const bookings = db.prepare(`SELECT b.*,i.name as unit_name,i.type as unit_type,i.city,i.location_desc FROM ae_bookings b JOIN ae_inventory i ON b.unit_id=i.id WHERE b.campaign_id=? AND b.status!='cancelled' ORDER BY b.start_date`).all(req.params.id);
  return res.json({ campaign, bookings });
});
router.post('/', requireAuth, requireRole('admin','sales'), (req, res) => {
  const { client_id,name,start_date,end_date,budget,status,notes } = req.body;
  if (!client_id||!name||!start_date||!end_date) return res.status(400).json({ error: 'client_id,name,start_date,end_date required' });
  const r = db.prepare('INSERT INTO ae_campaigns (client_id,name,start_date,end_date,budget,status,notes) VALUES (?,?,?,?,?,?,?)').run(client_id,name,start_date,end_date,budget||0,status||'upcoming',notes||'');
  return res.status(201).json({ id: r.lastInsertRowid });
});
router.put('/:id', requireAuth, requireRole('admin','sales'), (req, res) => {
  const { name,start_date,end_date,budget,status,notes } = req.body;
  db.prepare('UPDATE ae_campaigns SET name=?,start_date=?,end_date=?,budget=?,status=?,notes=? WHERE id=?').run(name,start_date,end_date,budget,status,notes||'',req.params.id);
  return res.json({ ok: true });
});
export default router;
""".strip())

# ?? src/routes/bookings.ts ????????????????????????????????????????????????????
w(ROUTES / "bookings.ts", r"""
import { Router } from 'express';
import { db } from '../db';
import { requireAuth, requireRole } from '../middleware/auth';
const router = Router();
router.get('/', requireAuth, (req, res) => {
  const { campaign_id,unit_id,status } = req.query;
  let sql = `SELECT b.*,c.name as campaign_name,cl.name as client_name,i.name as unit_name,i.type as unit_type,i.city,i.location_desc FROM ae_bookings b JOIN ae_campaigns c ON b.campaign_id=c.id JOIN ae_clients cl ON c.client_id=cl.id JOIN ae_inventory i ON b.unit_id=i.id WHERE 1=1`;
  const p: any[] = [];
  if (campaign_id) { sql += ' AND b.campaign_id=?'; p.push(campaign_id); }
  if (unit_id) { sql += ' AND b.unit_id=?'; p.push(unit_id); }
  if (status)  { sql += ' AND b.status=?'; p.push(status); }
  sql += ' ORDER BY b.created_at DESC';
  return res.json({ bookings: db.prepare(sql).all(...p) });
});
function checkConflict(unitId: number, start: string, end: string, excl?: number): any {
  let sql = `SELECT b.id,b.start_date,b.end_date,c.name as campaign_name FROM ae_bookings b JOIN ae_campaigns c ON b.campaign_id=c.id WHERE b.unit_id=? AND b.status NOT IN ('cancelled','completed') AND b.start_date<? AND b.end_date>?`;
  const p: any[] = [unitId,end,start];
  if (excl) { sql += ' AND b.id!=?'; p.push(excl); }
  return db.prepare(sql).get(...p);
}
router.post('/check-conflict', requireAuth, (req, res) => {
  const { unit_id,start_date,end_date,exclude_booking_id } = req.body;
  const c = checkConflict(Number(unit_id),start_date,end_date,exclude_booking_id);
  return res.json({ conflict: !!c, detail: c ? `Conflicts with "${c.campaign_name}" (${c.start_date} to ${c.end_date})` : null });
});
router.post('/', requireAuth, requireRole('admin','sales','ops'), (req, res) => {
  const { campaign_id,unit_id,start_date,end_date,monthly_rate,status } = req.body;
  if (!campaign_id||!unit_id||!start_date||!end_date||!monthly_rate) return res.status(400).json({ error: 'All fields required' });
  const c = checkConflict(Number(unit_id),start_date,end_date);
  if (c) return res.status(409).json({ error: 'Booking conflict', conflict: true, detail: `Conflicts with "${c.campaign_name}" (${c.start_date} to ${c.end_date})` });
  const r = db.prepare('INSERT INTO ae_bookings (campaign_id,unit_id,start_date,end_date,monthly_rate,status,created_by) VALUES (?,?,?,?,?,?,?)').run(campaign_id,unit_id,start_date,end_date,monthly_rate,status||'confirmed',req.user!.userId);
  if ((status||'confirmed')==='confirmed') db.prepare("UPDATE ae_inventory SET status='booked' WHERE id=?").run(unit_id);
  return res.status(201).json({ id: r.lastInsertRowid, conflict: false });
});
router.put('/:id', requireAuth, requireRole('admin','sales'), (req, res) => {
  const bk = db.prepare('SELECT * FROM ae_bookings WHERE id=?').get(req.params.id) as any;
  if (!bk) return res.status(404).json({ error: 'Not found' });
  const { start_date,end_date,monthly_rate,status } = req.body;
  if (start_date&&end_date) {
    const c = checkConflict(bk.unit_id,start_date,end_date,Number(req.params.id));
    if (c) return res.status(409).json({ error: 'Conflict', conflict: true, detail: `Conflicts with "${c.campaign_name}"` });
  }
  db.prepare('UPDATE ae_bookings SET start_date=?,end_date=?,monthly_rate=?,status=? WHERE id=?').run(start_date||bk.start_date,end_date||bk.end_date,monthly_rate||bk.monthly_rate,status||bk.status,req.params.id);
  return res.json({ ok: true });
});
router.delete('/:id', requireAuth, requireRole('admin'), (req, res) => {
  db.prepare("UPDATE ae_bookings SET status='cancelled' WHERE id=?").run(req.params.id); return res.json({ ok: true });
});
export default router;
""".strip())

# ?? src/routes/users.ts ???????????????????????????????????????????????????????
w(ROUTES / "users.ts", r"""
import { Router } from 'express';
import * as bcrypt from 'bcryptjs';
import { db } from '../db';
import { requireAuth, requireRole } from '../middleware/auth';
const router = Router();
router.use(requireAuth, requireRole('admin'));
router.get('/', (req, res) => res.json({ users: db.prepare('SELECT id,email,name,role,active,created_at FROM ae_users ORDER BY created_at').all() }));
router.post('/', (req, res) => {
  const { email,password,name,role } = req.body;
  if (!email||!password||!name||!role) return res.status(400).json({ error: 'All fields required' });
  if (!['admin','sales','ops','client'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
  try {
    const r = db.prepare('INSERT INTO ae_users (email,password_hash,name,role) VALUES (?,?,?,?)').run(email.toLowerCase().trim(),bcrypt.hashSync(password,10),name,role);
    return res.status(201).json({ id: r.lastInsertRowid });
  } catch (e: any) { if (e.message?.includes('UNIQUE')) return res.status(409).json({ error: 'Email exists' }); throw e; }
});
router.put('/:id', (req, res) => {
  const u = db.prepare('SELECT * FROM ae_users WHERE id=?').get(req.params.id) as any;
  if (!u) return res.status(404).json({ error: 'Not found' });
  const { name,role,active,password } = req.body;
  if (password) db.prepare('UPDATE ae_users SET password_hash=? WHERE id=?').run(bcrypt.hashSync(password,10),req.params.id);
  db.prepare('UPDATE ae_users SET name=?,role=?,active=? WHERE id=?').run(name||u.name,role||u.role,active!==undefined?(active?1:0):u.active,req.params.id);
  return res.json({ ok: true });
});
export default router;
""".strip())

# ?? src/routes/weather.ts ?????????????????????????????????????????????????????
w(ROUTES / "weather.ts", r"""
import { Router } from 'express';
import { db } from '../db';
import { requireAuth } from '../middleware/auth';
// Node 18+ native global fetch - handles brotli/gzip natively; node-fetch v2 cannot
const router = Router();
const cache = new Map<string,{data:any;ts:number}>();
const TTL = 10*60*1000;
const CODES: Record<number,string> = {0:'Clear sky',1:'Mainly clear',2:'Partly cloudy',3:'Overcast',45:'Foggy',48:'Rime fog',51:'Light drizzle',53:'Moderate drizzle',55:'Heavy drizzle',61:'Light rain',63:'Moderate rain',65:'Heavy rain',71:'Light snow',80:'Rain showers',81:'Moderate showers',82:'Violent showers',95:'Thunderstorm',96:'Thunderstorm/hail',99:'Heavy thunderstorm/hail'};
router.get('/:unitId', requireAuth, async (req, res) => {
  const { unitId } = req.params;
  const unit = db.prepare('SELECT lat,lng,name,city FROM ae_inventory WHERE id=?').get(unitId) as any;
  if (!unit) return res.status(404).json({ error: 'Unit not found' });
  const cached = cache.get(unitId);
  if (cached && Date.now()-cached.ts<TTL) return res.json(cached.data);
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${unit.lat}&longitude=${unit.lng}&hourly=temperature_2m,wind_speed_10m,wind_gusts_10m,precipitation,weather_code,visibility&current=temperature_2m,wind_speed_10m,wind_gusts_10m,precipitation,weather_code&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto&forecast_days=3`;
    const r = await fetch(url);
    if (!r.ok) throw new Error(`Open-Meteo ${r.status}`);
    const raw = await r.json() as any;
    const cur = raw.current||{};
    const isHigh = (cur.precipitation||0)>0.5||(cur.wind_speed_10m||0)>25||(cur.wind_gusts_10m||0)>35;
    const data = {
      unit:{id:unitId,name:unit.name,city:unit.city,lat:unit.lat,lng:unit.lng},
      current:{temperature:cur.temperature_2m,wind_speed:cur.wind_speed_10m,wind_gusts:cur.wind_gusts_10m,precipitation:cur.precipitation,weather_code:cur.weather_code,weather_desc:CODES[cur.weather_code]||'Unknown',install_risk:isHigh?'HIGH':'LOW',install_risk_reason:isHigh?[((cur.precipitation||0)>0.5?`Precipitation ${(cur.precipitation||0).toFixed(1)}mm/h`:null),((cur.wind_speed_10m||0)>25?`Wind ${(cur.wind_speed_10m||0).toFixed(0)}mph`:null),((cur.wind_gusts_10m||0)>35?`Gusts ${(cur.wind_gusts_10m||0).toFixed(0)}mph`:null)].filter(Boolean).join(', '):'Conditions favorable'},
      hourly:{time:raw.hourly?.time?.slice(0,72),temperature_2m:raw.hourly?.temperature_2m?.slice(0,72),wind_speed_10m:raw.hourly?.wind_speed_10m?.slice(0,72),precipitation:raw.hourly?.precipitation?.slice(0,72),weather_code:raw.hourly?.weather_code?.slice(0,72),visibility:raw.hourly?.visibility?.slice(0,72)},
      timezone:raw.timezone,fetched_at:new Date().toISOString()
    };
    cache.set(unitId,{data,ts:Date.now()});
    return res.json(data);
  } catch(err:any) { return res.status(502).json({ error:'Weather unavailable', detail:err.message }); }
});
export default router;
""".strip())

# ?? src/routes/traffic.ts ?????????????????????????????????????????????????????
w(ROUTES / "traffic.ts", r"""
import { Router } from 'express';
import { db } from '../db';
import { requireAuth } from '../middleware/auth';
// Node 18+ native global fetch
const router = Router();
const cache = new Map<string,{data:any;ts:number}>();
const TTL = 15*60*1000;
const KEY = process.env.TOMTOM_API_KEY||'';
function mock(unitId:string,lat:number,lng:number){
  const seed=Math.abs(lat*1000+lng*100+Number(unitId)*7)%100;
  const ff=45+(seed%20); const cong=15+(seed%50); const cs=Math.round(ff*(1-cong/100));
  return {currentSpeed:cs,freeFlowSpeed:ff,congestionPct:cong,confidence:0.85,roadClosure:false,trafficScore:cong,impression_multiplier:(1+cong/200).toFixed(2),source:'mock'};
}
router.get('/:unitId', requireAuth, async (req, res) => {
  const { unitId } = req.params;
  const unit = db.prepare('SELECT lat,lng,name FROM ae_inventory WHERE id=?').get(unitId) as any;
  if (!unit) return res.status(404).json({ error: 'Unit not found' });
  const cached = cache.get(unitId);
  if (cached && Date.now()-cached.ts<TTL) return res.json(cached.data);
  if (!KEY) {
    const d={...mock(unitId,unit.lat,unit.lng),unit:{id:unitId,name:unit.name}};
    cache.set(unitId,{data:d,ts:Date.now()}); return res.json(d);
  }
  try {
    const r = await fetch(`https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json?point=${unit.lat},${unit.lng}&key=${KEY}`);
    if (!r.ok) throw new Error(`TomTom ${r.status}`);
    const raw=await r.json() as any; const seg=raw.flowSegmentData||{};
    const ff=seg.freeFlowSpeed||45; const cs=seg.currentSpeed||ff;
    const cong=ff>0?Math.max(0,Math.round(((ff-cs)/ff)*100)):0;
    const d={currentSpeed:cs,freeFlowSpeed:ff,congestionPct:cong,confidence:seg.confidence||0.9,roadClosure:seg.roadClosure||false,trafficScore:cong,impression_multiplier:(1+cong/200).toFixed(2),source:'tomtom',unit:{id:unitId,name:unit.name}};
    cache.set(unitId,{data:d,ts:Date.now()}); return res.json(d);
  } catch { const d={...mock(unitId,unit.lat,unit.lng),unit:{id:unitId,name:unit.name}}; cache.set(unitId,{data:d,ts:Date.now()}); return res.json(d); }
});
router.get('/', requireAuth, async (req, res) => {
  const units = db.prepare("SELECT id,lat,lng,name FROM ae_inventory WHERE status!='maintenance'").all() as any[];
  const scores = units.map(u=>{ const c=cache.get(String(u.id)); return c&&Date.now()-c.ts<TTL?{id:u.id,...c.data}:{id:u.id,name:u.name,...mock(String(u.id),u.lat,u.lng)}; });
  return res.json({ traffic: scores });
});
export default router;
""".strip())

# ?? src/index.ts ?????????????????????????????????????????????????????????????
w(SRC / "index.ts", r"""
import 'dotenv/config';
import './db';
import express from 'express';
import cors from 'cors';
import authRouter from './routes/auth';
import inventoryRouter from './routes/inventory';
import clientsRouter from './routes/clients';
import campaignsRouter from './routes/campaigns';
import bookingsRouter from './routes/bookings';
import usersRouter from './routes/users';
import weatherRouter from './routes/weather';
import trafficRouter from './routes/traffic';
const app = express();
const PORT = parseInt(process.env.PORT||'3741',10);
app.use(cors({origin:['https://michaelwegter.com','https://www.michaelwegter.com','http://localhost:5173','http://localhost:4173','http://localhost:3000'],credentials:true}));
app.use(express.json());
app.get('/health',(_req,res)=>res.json({ok:true,service:'adverteyes-api',ts:new Date().toISOString()}));
app.use('/auth',authRouter);
app.use('/inventory',inventoryRouter);
app.use('/clients',clientsRouter);
app.use('/campaigns',campaignsRouter);
app.use('/bookings',bookingsRouter);
app.use('/users',usersRouter);
app.use('/weather',weatherRouter);
app.use('/traffic',trafficRouter);
app.use((err:any,_req:express.Request,res:express.Response,_next:express.NextFunction)=>{console.error('[error]',err);res.status(500).json({error:'Internal server error',detail:err.message});});
app.listen(PORT,'127.0.0.1',()=>console.log(`[adverteyes-api] listening on http://127.0.0.1:${PORT}`));
""".strip())

NPM  = r"C:\Program Files\nodejs\npm.cmd"
NODE = r"C:\Program Files\nodejs\node.exe"
NODE_DIR = r"C:\Program Files\nodejs"

# Ensure node is on PATH so node-gyp (used by better-sqlite3) can find it
_env = {**os.environ, "PATH": NODE_DIR + ";" + os.environ.get("PATH", ""), "npm_config_node_gyp_force_latest": "true"}

print("\n=== All files written. Installing dependencies... ===\n")

result = subprocess.run(
    [NPM, "install"],
    cwd=str(WORKSPACE),
    capture_output=True, text=True,
    env=_env,
)
out = result.stdout[-3000:] if len(result.stdout)>3000 else result.stdout
err = result.stderr[-1000:] if len(result.stderr)>1000 else result.stderr
print(out or err)
if result.returncode != 0:
    print("npm install STDERR:", err)
    sys.exit(1)
print("npm install: OK")

print("\n=== Compiling TypeScript... ===\n")
result2 = subprocess.run(
    [NPM, "run", "build"],
    cwd=str(WORKSPACE),
    capture_output=True, text=True,
    env=_env,
)
print(result2.stdout[-2000:] if len(result2.stdout)>2000 else result2.stdout)
if result2.returncode != 0:
    print("tsc STDERR:", result2.stderr[-3000:])
    print("tsc STDOUT:", result2.stdout[-2000:])
    sys.exit(1)
print("TypeScript compile: OK")

print(f"\nBUILD SUCCESS - dist/ ready at {WORKSPACE}/dist/")
print(f"Run 'node dist/index.js' in {WORKSPACE} to start")
