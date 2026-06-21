#!/usr/bin/env python3
"""
Fix adverteyes-api: replace better-sqlite3 with node:sqlite (Node 22+ built-in).
"""
import os, subprocess, sys, json
from pathlib import Path

WORKSPACE = Path("adverteyes-api")
SRC = WORKSPACE / "src"

def w(path, content):
    Path(path).write_text(content, encoding="utf-8")
    print("  wrote " + str(path))

# package.json: no better-sqlite3, updated @types/node
w(WORKSPACE / "package.json", json.dumps({
  "name": "adverteyes-api",
  "version": "1.0.0",
  "main": "dist/index.js",
  "scripts": {"build": "tsc", "start": "node dist/index.js"},
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "jsonwebtoken": "^9.0.2",
    "node-fetch": "^2.7.0"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/jsonwebtoken": "^9.0.6",
    "@types/node": "^22.0.0",
    "@types/node-fetch": "^2.6.11",
    "typescript": "^5.4.5"
  }
}, indent=2))

# tsconfig.json
w(WORKSPACE / "tsconfig.json", json.dumps({
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "moduleResolution": "node",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": True,
    "esModuleInterop": True,
    "skipLibCheck": True,
    "resolveJsonModule": True,
    "lib": ["ES2022"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}, indent=2))

# db.ts using node:sqlite (built-in Node 22+, no native compile needed)
DB_TS = """
import { DatabaseSync } from 'node:sqlite';
import * as bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';

const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
const DB_PATH = path.join(DATA_DIR, 'adverteyes.db');
export const db = new DatabaseSync(DB_PATH);

db.exec("PRAGMA journal_mode=WAL");
db.exec("PRAGMA foreign_keys=ON");

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

const userCount = (db.prepare('SELECT COUNT(*) as c FROM ae_users').get() as any).c as number;
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

  const ii = db.prepare('INSERT INTO ae_inventory (name,type,subtype,location_desc,city,state,lat,lng,width_ft,height_ft,illuminated,digital,monthly_rate,weekly_impressions,status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
  ii.run('I-275 North Gateway','billboard','highway','I-275 at Bearss Ave overpass','Tampa','FL',28.0854,-82.4374,14,48,1,0,4200,55000,'booked');
  ii.run('I-4 West Corridor','billboard','highway','I-4 @ Mango Rd exit, westbound','Tampa','FL',27.9834,-82.3521,14,48,1,0,3900,48000,'available');
  ii.run('Dale Mabry and Kennedy','billboard','arterial','SW corner, facing north','Tampa','FL',27.9472,-82.5020,10,36,1,0,2800,38000,'booked');
  ii.run('US-19 Clearwater North','billboard','arterial','US-19 and Sunset Point Rd','Clearwater','FL',27.9975,-82.7468,10,36,1,0,2600,34000,'available');
  ii.run('Gandy Blvd Bridge Approach','billboard','arterial','Gandy Blvd W, westbound approach','Tampa','FL',27.8991,-82.5340,10,36,0,0,2200,30000,'available');
  ii.run('SR-60 Brandon Corridor','billboard','suburban','SR-60 at Falkenburg Rd','Brandon','FL',27.9337,-82.3147,14,48,0,0,1900,26000,'maintenance');
  ii.run('Hillsborough Ave and Armenia','billboard','arterial','NW corner, facing east','Tampa','FL',27.9808,-82.4839,10,36,1,0,2400,31000,'booked');
  ii.run('US-41 South Tampa','billboard','arterial','US-41 and Macdill Ave intersection','Tampa','FL',27.9020,-82.5164,10,36,1,0,2700,36000,'available');
  ii.run('Channelside Bay Plaza Digital','dooh','mall','Channelside Dr, main entrance','Tampa','FL',27.9435,-82.4521,12,20,1,1,8500,180000,'booked');
  ii.run('Westshore Mall Atrium','dooh','mall','Westshore Mall center court','Tampa','FL',27.9533,-82.5257,8,14,1,1,6200,95000,'available');
  ii.run('Amalie Arena North Facade','dooh','stadium','Channelside Dr, arena north','Tampa','FL',27.9428,-82.4512,20,30,1,1,11000,220000,'booked');
  ii.run('Tampa Intl Airport Arrivals','dooh','transit','TIA Terminal F arrivals hall','Tampa','FL',27.9763,-82.5326,10,16,1,1,9500,160000,'available');
  ii.run('Ybor City 7th Ave Strip','dooh','entertainment','7th Ave between 15th-17th St','Tampa','FL',27.9594,-82.4381,8,12,1,1,5800,88000,'available');
  ii.run('Clearwater Beach Boardwalk','dooh','entertainment','Pier 60 Park entrance','Clearwater','FL',27.9774,-82.8274,10,18,1,1,7200,120000,'booked');
  ii.run('Clearwater Mall Digital','dooh','mall','Clearwater Mall main entrance','Clearwater','FL',27.9659,-82.7533,8,14,1,1,5400,76000,'available');
  ii.run('City Route Alpha - Tampa Core','truckside','city','Covers downtown Tampa daily route','Tampa','FL',27.9506,-82.4572,8,16,0,0,3200,28000,'available');
  ii.run('City Route Beta - Pinellas','truckside','city','St. Pete and Clearwater daily loop','St. Petersburg','FL',27.7676,-82.6393,8,16,0,0,2900,24000,'booked');
  ii.run('Suburban Route Gamma - Brandon','truckside','suburban','Brandon to Riverview daily','Brandon','FL',27.9374,-82.3050,8,16,0,0,2100,19000,'available');
  ii.run('Suburban Route Delta - Northdale','truckside','suburban','Wesley Chapel to Carrollwood','Tampa','FL',28.1027,-82.5190,8,16,0,0,1900,17000,'available');
  ii.run('University Area Route - USF','truckside','university','USF campus loop and Fowler Ave','Tampa','FL',28.0622,-82.4142,8,16,0,0,2300,22000,'available');
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
  ib.run(3,21,'2026-05-15','2026-07-31',1600,'confirmed',1);
  ib.run(4,8,'2026-06-15','2026-09-15',2700,'confirmed',2);
  ib.run(4,12,'2026-06-15','2026-09-15',9500,'confirmed',2);
  ib.run(4,16,'2026-06-15','2026-09-15',3200,'confirmed',1);
  ib.run(5,20,'2026-01-01','2026-03-31',2300,'completed',1);
  ib.run(2,2,'2026-08-01','2026-09-30',3900,'confirmed',2);
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
""".strip()

w(SRC / "db.ts", DB_TS)

NPM  = r"C:\Program Files\nodejs\npm.cmd"
NODE_DIR = r"C:\Program Files\nodejs"
_env = {**os.environ, "PATH": NODE_DIR + ";" + os.environ.get("PATH", "")}

print("\n=== Patched files written. Running npm install + build... ===\n")

result = subprocess.run(
    [NPM, "install"],
    cwd=str(WORKSPACE),
    capture_output=True, text=True,
    env=_env,
)
print("STDOUT:", result.stdout[-3000:] if len(result.stdout) > 3000 else result.stdout)
print("STDERR:", result.stderr[-2000:] if len(result.stderr) > 2000 else result.stderr)
if result.returncode != 0:
    print("npm install FAILED exit=" + str(result.returncode))
    sys.exit(1)

result2 = subprocess.run(
    [NPM, "run", "build"],
    cwd=str(WORKSPACE),
    capture_output=True, text=True,
    env=_env,
)
print("tsc STDOUT:", result2.stdout[-3000:] if len(result2.stdout) > 3000 else result2.stdout)
print("tsc STDERR:", result2.stderr[-3000:] if len(result2.stderr) > 3000 else result2.stderr)
if result2.returncode != 0:
    print("[build] FAILED exit=" + str(result2.returncode))
    sys.exit(1)
print("[build] Success")
