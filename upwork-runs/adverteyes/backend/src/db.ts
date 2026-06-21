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

// ── Schema ────────────────────────────────────────────────────────────────────

db.exec(`
CREATE TABLE IF NOT EXISTS ae_users (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  email       TEXT    UNIQUE NOT NULL,
  password_hash TEXT  NOT NULL,
  name        TEXT    NOT NULL DEFAULT '',
  role        TEXT    NOT NULL DEFAULT 'ops',
  active      INTEGER NOT NULL DEFAULT 1,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS ae_clients (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL,
  contact     TEXT NOT NULL DEFAULT '',
  email       TEXT NOT NULL DEFAULT '',
  phone       TEXT NOT NULL DEFAULT '',
  industry    TEXT NOT NULL DEFAULT '',
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS ae_inventory (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  name            TEXT    NOT NULL,
  type            TEXT    NOT NULL,
  subtype         TEXT    NOT NULL DEFAULT '',
  location_desc   TEXT    NOT NULL,
  city            TEXT    NOT NULL DEFAULT '',
  state           TEXT    NOT NULL DEFAULT 'FL',
  lat             REAL    NOT NULL,
  lng             REAL    NOT NULL,
  width_ft        REAL    NOT NULL DEFAULT 14,
  height_ft       REAL    NOT NULL DEFAULT 48,
  illuminated     INTEGER NOT NULL DEFAULT 0,
  digital         INTEGER NOT NULL DEFAULT 0,
  monthly_rate    REAL    NOT NULL,
  weekly_impressions INTEGER NOT NULL DEFAULT 0,
  status          TEXT    NOT NULL DEFAULT 'available',
  notes           TEXT    NOT NULL DEFAULT '',
  created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS ae_campaigns (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id     INTEGER NOT NULL REFERENCES ae_clients(id),
  name          TEXT    NOT NULL,
  start_date    TEXT    NOT NULL,
  end_date      TEXT    NOT NULL,
  budget        REAL    NOT NULL DEFAULT 0,
  status        TEXT    NOT NULL DEFAULT 'upcoming',
  notes         TEXT    NOT NULL DEFAULT '',
  created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS ae_bookings (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_id   INTEGER NOT NULL REFERENCES ae_campaigns(id),
  unit_id       INTEGER NOT NULL REFERENCES ae_inventory(id),
  start_date    TEXT    NOT NULL,
  end_date      TEXT    NOT NULL,
  monthly_rate  REAL    NOT NULL,
  status        TEXT    NOT NULL DEFAULT 'confirmed',
  created_by    INTEGER REFERENCES ae_users(id),
  created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS ae_activity (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER REFERENCES ae_users(id),
  action      TEXT NOT NULL,
  entity      TEXT NOT NULL DEFAULT '',
  entity_id   INTEGER,
  detail      TEXT NOT NULL DEFAULT '',
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
`);

// ── Seed ─────────────────────────────────────────────────────────────────────

const userCount = (db.prepare('SELECT COUNT(*) as c FROM ae_users').get() as any).c;
if (userCount === 0) {
  console.log('[db] Seeding database...');

  // Users
  const users = [
    { email: 'admin@adverteyes.com',  password: 'Admin123!',   name: 'Alex Rivera',    role: 'admin'  },
    { email: 'sarah@adverteyes.com',  password: 'Sales123!',   name: 'Sarah Chen',     role: 'sales'  },
    { email: 'ops@adverteyes.com',    password: 'Ops1234!',    name: 'Marcus Johnson', role: 'ops'    },
    { email: 'client@forddealer.com', password: 'Client12!',   name: 'Ford Dealer Rep', role: 'client' },
  ];
  const insertUser = db.prepare(`INSERT INTO ae_users (email, password_hash, name, role) VALUES (?, ?, ?, ?)`);
  for (const u of users) {
    insertUser.run(u.email, bcrypt.hashSync(u.password, 10), u.name, u.role);
  }

  // Clients
  const insertClient = db.prepare(`INSERT INTO ae_clients (name, contact, email, phone, industry) VALUES (?, ?, ?, ?, ?)`);
  insertClient.run('Ford Dealer Group Tampa', 'Jim Patterson', 'jim@fordtampa.com', '813-555-0101', 'Automotive');
  insertClient.run('Metro Health Network', 'Dr. Lisa Wu', 'lisa@metrohealth.com', '813-555-0202', 'Healthcare');
  insertClient.run('Pepsi Regional Southeast', 'Carlos Reyes', 'creyes@pepsi.com', '813-555-0303', 'CPG');
  insertClient.run('Coastal Credit Union', 'Amanda Brooks', 'abrooks@coastalcu.com', '813-555-0404', 'Finance');
  insertClient.run('FitCore Gym', 'Ryan Torres', 'ryan@fitcore.com', '813-555-0505', 'Fitness');

  // Inventory — 20 units across Tampa Bay area
  const insertUnit = db.prepare(`
    INSERT INTO ae_inventory (name, type, subtype, location_desc, city, state, lat, lng, width_ft, height_ft, illuminated, digital, monthly_rate, weekly_impressions, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Static Billboards (8)
  insertUnit.run('I-275 North Gateway','billboard','highway','I-275 at Bearss Ave overpass','Tampa','FL',28.0854,-82.4374,14,48,1,0,4200,55000,'booked');
  insertUnit.run('I-4 West Corridor','billboard','highway','I-4 @ Mango Rd exit, westbound','Tampa','FL',27.9834,-82.3521,14,48,1,0,3900,48000,'available');
  insertUnit.run('Dale Mabry & Kennedy','billboard','arterial','SW corner, facing north','Tampa','FL',27.9472,-82.5020,10,36,1,0,2800,38000,'booked');
  insertUnit.run('US-19 Clearwater North','billboard','arterial','US-19 & Sunset Point Rd','Clearwater','FL',27.9975,-82.7468,10,36,1,0,2600,34000,'available');
  insertUnit.run('Gandy Blvd Bridge Approach','billboard','arterial','Gandy Blvd W, westbound approach','Tampa','FL',27.8991,-82.5340,10,36,0,0,2200,30000,'available');
  insertUnit.run('SR-60 Brandon Corridor','billboard','suburban','SR-60 at Falkenburg Rd','Brandon','FL',27.9337,-82.3147,14,48,0,0,1900,26000,'maintenance');
  insertUnit.run('Hillsborough Ave & Armenia','billboard','arterial','NW corner, facing east','Tampa','FL',27.9808,-82.4839,10,36,1,0,2400,31000,'booked');
  insertUnit.run('US-41 South Tampa','billboard','arterial','US-41 & Macdill Ave intersection','Tampa','FL',27.9020,-82.5164,10,36,1,0,2700,36000,'available');

  // DOOH Digital Screens (6)
  insertUnit.run('Channelside Bay Plaza Digital','dooh','mall','Channelside Dr, main entrance','Tampa','FL',27.9435,-82.4521,12,20,1,1,8500,180000,'booked');
  insertUnit.run('Westshore Mall Atrium','dooh','mall','Westshore Mall center court','Tampa','FL',27.9533,-82.5257,8,14,1,1,6200,95000,'available');
  insertUnit.run('Amalie Arena North Facade','dooh','stadium','Channelside Dr, arena north','Tampa','FL',27.9428,-82.4512,20,30,1,1,11000,220000,'booked');
  insertUnit.run('Tampa Int\'l Airport Arrivals','dooh','transit','TIA Terminal F arrivals hall','Tampa','FL',27.9763,-82.5326,10,16,1,1,9500,160000,'available');
  insertUnit.run('Ybor City 7th Ave Strip','dooh','entertainment','7th Ave between 15th-17th St','Tampa','FL',27.9594,-82.4381,8,12,1,1,5800,88000,'available');
  insertUnit.run('Clearwater Beach Boardwalk','dooh','entertainment','Pier 60 Park entrance','Clearwater','FL',27.9774,-82.8274,10,18,1,1,7200,120000,'booked');

  // Truckside Wraps (6)
  insertUnit.run('City Route Alpha — Tampa Core','truckside','city','Covers downtown Tampa daily route','Tampa','FL',27.9506,-82.4572,8,16,0,0,3200,28000,'available');
  insertUnit.run('City Route Beta — Pinellas','truckside','city','St. Pete / Clearwater daily loop','St. Petersburg','FL',27.7676,-82.6393,8,16,0,0,2900,24000,'booked');
  insertUnit.run('Suburban Route Gamma — Brandon','truckside','suburban','Brandon to Riverview daily','Brandon','FL',27.9374,-82.3050,8,16,0,0,2100,19000,'available');
  insertUnit.run('Suburban Route Delta — Northdale','truckside','suburban','Wesley Chapel to Carrollwood','Tampa','FL',28.1027,-82.5190,8,16,0,0,1900,17000,'available');
  insertUnit.run('University Area Route — USF','truckside','university','USF campus loop + Fowler Ave','Tampa','FL',28.0622,-82.4142,8,16,0,0,2300,22000,'available');
  insertUnit.run('Port Tampa Route — Industrial','truckside','industrial','Port Tampa Bay industrial corridor','Tampa','FL',27.8618,-82.5562,8,16,0,0,1600,14000,'booked');

  // Campaigns (8)
  const insertCampaign = db.prepare(`
    INSERT INTO ae_campaigns (client_id, name, start_date, end_date, budget, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertCampaign.run(1,'Ford Summer Sales Event','2026-06-01','2026-08-31',85000,'active');
  insertCampaign.run(2,'Metro Health Back to School','2026-08-01','2026-09-30',42000,'upcoming');
  insertCampaign.run(3,'Pepsi Summer Refresh','2026-05-15','2026-07-31',120000,'active');
  insertCampaign.run(4,'Coastal CU Home Loan Push','2026-06-15','2026-09-15',55000,'active');
  insertCampaign.run(5,'FitCore New Year Push','2026-01-01','2026-03-31',28000,'completed');
  insertCampaign.run(1,'Ford F-150 Launch','2026-10-01','2026-12-31',95000,'upcoming');
  insertCampaign.run(3,'Pepsi Football Season','2026-09-01','2026-12-15',140000,'upcoming');
  insertCampaign.run(2,'Metro Health Open Enrollment','2026-10-15','2026-11-30',38000,'upcoming');

  // Bookings (15 — including one conflict scenario for same unit different dates)
  const insertBooking = db.prepare(`
    INSERT INTO ae_bookings (campaign_id, unit_id, start_date, end_date, monthly_rate, status, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  // Campaign 1 (Ford Summer): units 1, 3, 7 (all booked status units)
  insertBooking.run(1,1,'2026-06-01','2026-08-31',4200,'confirmed',1);
  insertBooking.run(1,3,'2026-06-01','2026-08-31',2800,'confirmed',1);
  insertBooking.run(1,7,'2026-06-01','2026-08-31',2400,'confirmed',2);
  // Campaign 3 (Pepsi): units 9, 11, 14, 20 (dooh + truckside)
  insertBooking.run(3,9,'2026-05-15','2026-07-31',8500,'confirmed',2);
  insertBooking.run(3,11,'2026-05-15','2026-07-31',11000,'confirmed',2);
  insertBooking.run(3,14,'2026-05-15','2026-07-31',7200,'confirmed',2);
  insertBooking.run(3,17,'2026-05-15','2026-07-31',2900,'confirmed',1);
  insertBooking.run(3,20,'2026-05-15','2026-07-31',1600,'confirmed',1);
  // Campaign 4 (Coastal CU): units 8, 12, 16
  insertBooking.run(4,8,'2026-06-15','2026-09-15',2700,'confirmed',2);
  insertBooking.run(4,12,'2026-06-15','2026-09-15',9500,'confirmed',2);
  insertBooking.run(4,16,'2026-06-15','2026-09-15',3200,'confirmed',1);
  // Campaign 5 (FitCore - completed): units 19
  insertBooking.run(5,19,'2026-01-01','2026-03-31',2300,'completed',1);
  // Campaign 2 (Metro Health upcoming): unit 2 booked for future
  insertBooking.run(2,2,'2026-08-01','2026-09-30',3900,'confirmed',2);
  // CONFLICT scenario: unit 2 overlaps with campaign 2 booking above (for demo)
  insertBooking.run(1,3,'2026-09-01','2026-11-30',2800,'pending',2);
  // Campaign 1 extra
  insertBooking.run(1,18,'2026-06-01','2026-08-31',1900,'confirmed',1);

  // Activity log
  const insertActivity = db.prepare(`INSERT INTO ae_activity (user_id, action, entity, entity_id, detail) VALUES (?, ?, ?, ?, ?)`);
  insertActivity.run(1,'created','campaign',1,'Ford Summer Sales Event campaign created');
  insertActivity.run(2,'booked','inventory',1,'I-275 North Gateway booked for Ford Summer');
  insertActivity.run(2,'booked','inventory',9,'Channelside Bay Plaza Digital booked for Pepsi');
  insertActivity.run(1,'updated','campaign',3,'Pepsi Summer Refresh budget updated to $120k');
  insertActivity.run(3,'checked','inventory',6,'SR-60 Brandon set to maintenance');
  insertActivity.run(2,'created','campaign',4,'Coastal CU Home Loan Push campaign created');
  insertActivity.run(1,'approved','booking',4,'Pepsi Channelside booking approved');
  insertActivity.run(2,'booked','inventory',12,'TIA Airport digital booked for Coastal CU');

  console.log('[db] Seed complete.');
}
