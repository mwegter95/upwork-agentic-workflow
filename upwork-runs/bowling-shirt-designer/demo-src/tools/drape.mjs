#!/usr/bin/env node
/**
 * drape.mjs — offline garment drape simulator + AO baker + asset exporter.
 *
 * Produces public/shirt.bin: a draped Bowlifi-style mock-neck quarter-zip
 * bowling jersey mesh (front/back body panels, sleeves, stand collar, zipper,
 * trim bands) with per-vertex AO and panel-atlas UVs matching lib/compositor.ts.
 *
 * Pipeline: flat cut panels -> Coons-patch grids -> initial 3D placement around
 * a mannequin SDF -> PBD cloth solve with sewing constraints -> weld seams ->
 * normals + seam accents -> hemisphere-raycast AO -> trim/zipper geometry ->
 * packed binary export.
 *
 * Run: node tools/drape.mjs [--steps N] [--out path]
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = process.argv.includes('--out')
  ? process.argv[process.argv.indexOf('--out') + 1]
  : path.join(__dirname, '..', 'public', 'shirt.bin');

// ---------------------------------------------------------------- utilities
let _seed = 1337;
function rand() { // deterministic LCG
  _seed = (_seed * 1664525 + 1013904223) >>> 0;
  return _seed / 4294967296;
}
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const smooth = (a, b, x) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

/** Catmull-Rom sample of control points -> dense polyline */
function catmull(pts, samplesPerSeg = 12) {
  const out = [];
  const P = (i) => pts[clamp(i, 0, pts.length - 1)];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    for (let j = 0; j < samplesPerSeg; j++) {
      const t = j / samplesPerSeg, t2 = t * t, t3 = t2 * t;
      out.push([
        0.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
        0.5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3),
      ]);
    }
  }
  out.push([...pts[pts.length - 1]]);
  return out;
}

/** resample polyline to exactly n points by arclength */
function resample(poly, n) {
  const cum = [0];
  for (let i = 1; i < poly.length; i++) {
    cum.push(cum[i - 1] + Math.hypot(poly[i][0] - poly[i - 1][0], poly[i][1] - poly[i - 1][1]));
  }
  const total = cum[cum.length - 1];
  const out = [];
  let k = 0;
  for (let i = 0; i < n; i++) {
    const target = (i / (n - 1)) * total;
    while (k < cum.length - 2 && cum[k + 1] < target) k++;
    const span = cum[k + 1] - cum[k] || 1e-9;
    const t = (target - cum[k]) / span;
    out.push([lerp(poly[k][0], poly[k + 1][0], t), lerp(poly[k][1], poly[k + 1][1], t)]);
  }
  return out;
}

// ---------------------------------------------------------------- mannequin SDF
// Athletic male dress form. y up, z front. Origin ~ waist center.
const TORSO = [
  // [y, halfWidth, halfDepth, zCenter]
  [-0.55, 0.150, 0.098, 0.000],
  [-0.30, 0.160, 0.106, 0.000],
  [-0.12, 0.158, 0.104, 0.002],
  [ 0.00, 0.156, 0.104, 0.004],
  [ 0.12, 0.166, 0.112, 0.006],
  [ 0.24, 0.182, 0.121, 0.010],
  [ 0.33, 0.187, 0.116, 0.006],
  [ 0.40, 0.172, 0.101, 0.000],
  [ 0.46, 0.142, 0.085, -0.004],
  [ 0.52, 0.095, 0.070, -0.006],
];
const SE_N = 2.5;
const ARM_ANG = (38 * Math.PI) / 180; // from vertical
const ARM_DIR = [Math.sin(ARM_ANG), -Math.cos(ARM_ANG), 0.10];
(() => { const l = Math.hypot(...ARM_DIR); ARM_DIR[0] /= l; ARM_DIR[1] /= l; ARM_DIR[2] /= l; })();
const SHOULDER = { x: 0.172, y: 0.415, z: 0.004, r: 0.077 };
const ARM_LEN = 0.36, ARM_R0 = 0.056, ARM_R1 = 0.047;
const NECK = { x: 0, y0: 0.44, y1: 0.66, z0: 0.008, z1: 0.016, r: 0.058 };

// superellipse |x|^2.5: a*a*sqrt(a) avoids Math.pow in the hot path
function se25(a) { return a * a * Math.sqrt(a); }
function sdTorso(x, y, z) {
  if (y <= TORSO[0][0]) return (TORSO[0][0] - y) + 0.0;
  if (y >= TORSO[TORSO.length - 1][0]) {
    // round the very top off
    const [ty, hw, hd, zc] = TORSO[TORSO.length - 1];
    const q = Math.pow(se25(Math.abs(x) / hw) + se25(Math.abs(z - zc) / hd), 1 / SE_N);
    return Math.max((q - 1) * Math.min(hw, hd), y - ty);
  }
  let i = 0;
  while (i < TORSO.length - 2 && TORSO[i + 1][0] < y) i++;
  const [y0, hw0, hd0, zc0] = TORSO[i];
  const [y1, hw1, hd1, zc1] = TORSO[i + 1];
  const t = (y - y0) / (y1 - y0);
  const hw = lerp(hw0, hw1, t), hd = lerp(hd0, hd1, t), zc = lerp(zc0, zc1, t);
  const q = Math.pow(se25(Math.abs(x) / hw) + se25(Math.abs(z - zc) / hd), 1 / SE_N);
  return (q - 1) * Math.min(hw, hd);
}
function sdSphere(x, y, z, cx, cy, cz, r) {
  return Math.hypot(x - cx, y - cy, z - cz) - r;
}
function sdCapsule(x, y, z, ax, ay, az, bx, by, bz, r0, r1) {
  const abx = bx - ax, aby = by - ay, abz = bz - az;
  const apx = x - ax, apy = y - ay, apz = z - az;
  const t = clamp((apx * abx + apy * aby + apz * abz) / (abx * abx + aby * aby + abz * abz), 0, 1);
  const dx = apx - abx * t, dy = apy - aby * t, dz = apz - abz * t;
  return Math.hypot(dx, dy, dz) - lerp(r0, r1, t);
}
function smin(a, b, k) {
  const h = clamp(0.5 + 0.5 * (b - a) / k, 0, 1);
  return lerp(b, a, h) - k * h * (1 - h);
}
function mannequinSDF(x, y, z) {
  let d = sdTorso(x, y, z);
  d = smin(d, sdSphere(x, y, z, SHOULDER.x, SHOULDER.y, SHOULDER.z, SHOULDER.r), 0.03);
  d = smin(d, sdSphere(x, y, z, -SHOULDER.x, SHOULDER.y, SHOULDER.z, SHOULDER.r), 0.03);
  d = smin(d, sdCapsule(x, y, z, 0, NECK.y0, NECK.z0, 0, NECK.y1, NECK.z1, NECK.r, NECK.r - 0.004), 0.025);
  // trapezius: fills the neck-to-shoulder slope so the shoulder seam has support
  d = smin(d, sdCapsule(x, y, z, 0.02, NECK.y0 + 0.02, 0, SHOULDER.x - 0.01, SHOULDER.y, SHOULDER.z, 0.062, 0.058), 0.045);
  d = smin(d, sdCapsule(x, y, z, -0.02, NECK.y0 + 0.02, 0, -(SHOULDER.x - 0.01), SHOULDER.y, SHOULDER.z, 0.062, 0.058), 0.045);
  const ax = SHOULDER.x + ARM_DIR[0] * 0.02, ay = SHOULDER.y + ARM_DIR[1] * 0.02, az = SHOULDER.z;
  d = smin(d, sdCapsule(x, y, z, ax, ay, az, ax + ARM_DIR[0] * ARM_LEN, ay + ARM_DIR[1] * ARM_LEN, az + ARM_DIR[2] * ARM_LEN, ARM_R0, ARM_R1), 0.02);
  d = smin(d, sdCapsule(x, y, z, -ax, ay, az, -(ax + ARM_DIR[0] * ARM_LEN), ay + ARM_DIR[1] * ARM_LEN, az + ARM_DIR[2] * ARM_LEN, ARM_R0, ARM_R1), 0.02);
  // elbow bulge: keeps the (tapered) sleeve hem from creeping off the arm
  const ex = ax + ARM_DIR[0] * ARM_LEN * 0.80, ey = ay + ARM_DIR[1] * ARM_LEN * 0.80, ez = az + ARM_DIR[2] * ARM_LEN * 0.80;
  d = smin(d, sdSphere(x, y, z, ex, ey, ez, 0.064), 0.02);
  d = smin(d, sdSphere(x, y, z, -ex, ey, ez, 0.064), 0.02);
  return d;
}
function mannequinGrad(x, y, z, out) {
  const h = 0.0015;
  out[0] = mannequinSDF(x + h, y, z) - mannequinSDF(x - h, y, z);
  out[1] = mannequinSDF(x, y + h, z) - mannequinSDF(x, y - h, z);
  out[2] = mannequinSDF(x, y, z + h) - mannequinSDF(x, y, z - h);
  const l = Math.hypot(out[0], out[1], out[2]) || 1e-9;
  out[0] /= l; out[1] /= l; out[2] /= l;
}

// ---------------------------------------------------------------- panels
// Garment measurements (m). Boxy L bowling jersey.
const HALF_CHEST = 0.295;      // flat half width at underarm
const HEM_HALF = 0.283;
const HEM_Y = -0.34;
const UNDERARM_Y = 0.155;
const SHOULDER_TIP = [0.218, 0.383];
const NECK_HALF = 0.084;       // neck opening half width at shoulder line
const NECK_Y_SIDE = 0.428;     // neckline at shoulder point
const FRONT_NECK_Y = 0.365;    // front neckline center (mock neck sits high)
const BACK_NECK_Y = 0.412;

// grid resolution
const NS = 72;   // columns across panel
const NT = 92;   // rows: hem->shoulder tip along side chain
const SIDE_ROWS = 66;          // rows hem->underarm (rest are armhole)
const ARM_ROWS = NT - SIDE_ROWS; // 26 armhole rows per panel side
const SLEEVE_AROUND = ARM_ROWS * 2; // ring resolution (must match armhole loop)
const SLEEVE_ALONG = 26;
const SLEEVE_LEN = 0.235;
const SLEEVE_CIRC = 0.46;
const COLLAR_ROWS = 8;
const COLLAR_H = 0.064;

// s-fractions of the top chain (must be identical front/back for sewing)
const SHOULDER_COLS = 16; // columns 0..16 = left shoulder seam, NS-16..NS = right

function topChain(neckCenterY) {
  // left shoulder tip -> neck left -> center -> neck right -> right shoulder tip
  const shoulderL = resample(catmull([
    [-SHOULDER_TIP[0], SHOULDER_TIP[1]],
    [-(NECK_HALF + (SHOULDER_TIP[0] - NECK_HALF) * 0.45), lerp(NECK_Y_SIDE, SHOULDER_TIP[1], 0.42)],
    [-NECK_HALF, NECK_Y_SIDE],
  ]), SHOULDER_COLS + 1);
  const shoulderR = shoulderL.map(([x, y]) => [-x, y]).reverse();
  const neck = resample(catmull([
    [-NECK_HALF, NECK_Y_SIDE],
    [-NECK_HALF * 0.62, lerp(neckCenterY, NECK_Y_SIDE, 0.28)],
    [0, neckCenterY],
    [NECK_HALF * 0.62, lerp(neckCenterY, NECK_Y_SIDE, 0.28)],
    [NECK_HALF, NECK_Y_SIDE],
  ]), NS - 2 * SHOULDER_COLS + 1);
  return [...shoulderL.slice(0, -1), ...neck.slice(0, -1), ...shoulderR];
}

function sideChain(sign) {
  // hem corner -> underarm -> (armhole) -> shoulder tip. sign=-1 left, +1 right
  const seam = resample(catmull([
    [sign * HEM_HALF, HEM_Y],
    [sign * (HALF_CHEST - 0.004), lerp(HEM_Y, UNDERARM_Y, 0.55)],
    [sign * HALF_CHEST, UNDERARM_Y],
  ]), SIDE_ROWS + 1);
  const armhole = resample(catmull([
    [sign * HALF_CHEST, UNDERARM_Y],
    [sign * (HALF_CHEST - 0.037), lerp(UNDERARM_Y, SHOULDER_TIP[1], 0.36)],
    [sign * (SHOULDER_TIP[0] + 0.011), lerp(UNDERARM_Y, SHOULDER_TIP[1], 0.74)],
    [sign * SHOULDER_TIP[0], SHOULDER_TIP[1]],
  ]), ARM_ROWS + 1);
  return [...seam.slice(0, -1), ...armhole];
}

/** Coons patch: returns Float64Array pattern coords (x,y) for (NS+1)x(NT+1) grid */
function coonsGrid(bottom, top, left, right) {
  const W = NS + 1, H = NT + 1;
  const g = new Float64Array(W * H * 2);
  for (let iy = 0; iy < H; iy++) {
    const t = iy / NT;
    for (let ix = 0; ix < W; ix++) {
      const s = ix / NS;
      const B = bottom[ix], T = top[ix], L = left[iy], R = right[iy];
      const c00 = bottom[0], c10 = bottom[NS], c01 = top[0], c11 = top[NS];
      const x = (1 - t) * B[0] + t * T[0] + (1 - s) * L[0] + s * R[0]
        - ((1 - s) * (1 - t) * c00[0] + s * (1 - t) * c10[0] + (1 - s) * t * c01[0] + s * t * c11[0]);
      const y = (1 - t) * B[1] + t * T[1] + (1 - s) * L[1] + s * R[1]
        - ((1 - s) * (1 - t) * c00[1] + s * (1 - t) * c10[1] + (1 - s) * t * c01[1] + s * t * c11[1]);
      const k = (iy * W + ix) * 2;
      g[k] = x; g[k + 1] = y;
    }
  }
  return g;
}

function buildBodyPanel(isFront) {
  const neckY = isFront ? FRONT_NECK_Y : BACK_NECK_Y;
  const top = topChain(neckY);
  const left = sideChain(-1);
  const right = sideChain(1);
  const bottom = resample([[-HEM_HALF, HEM_Y], [HEM_HALF, HEM_Y]], NS + 1);
  const pat = coonsGrid(bottom, top, left, right);
  return { pat, W: NS + 1, H: NT + 1 };
}

// ---------------------------------------------------------------- particle system
const px = [], py = [], pz = [];          // grow as JS arrays then freeze
const patX = [], patY = [];               // 2D pattern coords (m)
const invMass = [];
const gravScale = [];
const panelOf = [];                       // 0 front,1 back,2 sleeveL,3 sleeveR,4 collar

function addVert(x, y, z, pu, pv, panel, gs = 1) {
  px.push(x); py.push(y); pz.push(z);
  patX.push(pu); patY.push(pv);
  invMass.push(1); gravScale.push(gs); panelOf.push(panel);
  return px.length - 1;
}

// --- body panels: wrap the flat pattern around a loose cylinder
const R_WRAP = 0.34;
function placeBody(pat, W, H, isFront) {
  const ids = new Int32Array(W * H);
  for (let iy = 0; iy < H; iy++) {
    for (let ix = 0; ix < W; ix++) {
      const k = (iy * W + ix) * 2;
      const x2 = pat[k], y2 = pat[k + 1];
      const th = x2 / R_WRAP;
      const zx = Math.cos(th) * R_WRAP;
      const x3 = Math.sin(th) * R_WRAP;
      const z3 = isFront ? (zx - R_WRAP + 0.185) : -(zx - R_WRAP + 0.175);
      ids[iy * W + ix] = addVert(x3, y2 + 0.012, z3, x2, y2, isFront ? 0 : 1);
    }
  }
  return ids;
}

const front = buildBodyPanel(true);
const back = buildBodyPanel(false);
const fIds = placeBody(front.pat, front.W, front.H, true);
const bIds = placeBody(back.pat, back.W, back.H, false);

// --- sleeves: tube around the arm axis, top ring shaped like a sleeve cap
function placeSleeve(side) { // side -1 left, +1 right
  const W = SLEEVE_AROUND + 1, H = SLEEVE_ALONG + 1;
  const ids = new Int32Array(W * H);
  const ax = side * (SHOULDER.x + ARM_DIR[0] * 0.012);
  const ay = SHOULDER.y + ARM_DIR[1] * 0.012;
  const az = SHOULDER.z + 0.002;
  const dir = [side * ARM_DIR[0], ARM_DIR[1], ARM_DIR[2]];
  // basis perpendicular to arm
  let u0 = [-dir[1], dir[0], 0];
  { const l = Math.hypot(...u0); u0 = u0.map((v) => v / l); }
  const v0 = [
    dir[1] * u0[2] - dir[2] * u0[1],
    dir[2] * u0[0] - dir[0] * u0[2],
    dir[0] * u0[1] - dir[1] * u0[0],
  ];
  const R = SLEEVE_CIRC / (2 * Math.PI);
  const panel = side < 0 ? 2 : 3;
  for (let iy = 0; iy < H; iy++) {
    const l = (iy / SLEEVE_ALONG) * SLEEVE_LEN;
    // sleeve cap: top ring starts higher on the shoulder side
    for (let ix = 0; ix < W; ix++) {
      const a = (ix / SLEEVE_AROUND) * Math.PI * 2; // 0 at underarm
      // cap drop: shoulder side (a=pi) extends 0 extra, underarm hangs lower start
      const capDrop = (1 - Math.cos(a)) * 0.5; // 0 underarm, 1 shoulder
      const lEff = l + (1 - capDrop) * 0.012;
      const cx = ax + dir[0] * lEff, cy = ay + dir[1] * lEff, cz = az + dir[2] * lEff;
      const taper = lerp(1.0, 0.93, iy / SLEEVE_ALONG);
      const wob = Math.sin(a * 3 + iy) * 0.001;
      const ca = Math.cos(a), sa = Math.sin(a);
      const off = [
        (u0[0] * ca + v0[0] * sa) * (R * taper + wob),
        (u0[1] * ca + v0[1] * sa) * (R * taper + wob),
        (u0[2] * ca + v0[2] * sa) * (R * taper + wob),
      ];
      // pattern coords: x = around arc centered, y = down the sleeve.
      // Tapered like a real sleeve cut: hem circumference 90% of the bicep.
      const pu = (ix / SLEEVE_AROUND - 0.5) * SLEEVE_CIRC * lerp(1.0, 0.90, iy / SLEEVE_ALONG);
      const pv = -l;
      ids[iy * W + ix] = addVert(cx + off[0], cy + off[1], cz + off[2], pu, pv, panel);
    }
  }
  return ids;
}
const slIds = placeSleeve(-1);
const srIds = placeSleeve(1);

// --- collar: open band around the neck (split at front center for the zip)
// bottom edge sewn to the combined neckline. Count = front neck verts + back neck verts.
const NECK_COLS = NS - 2 * SHOULDER_COLS; // segments in neckline chain per panel
// collar chain: front-center-right ... front-neck-right, back neckline (R->L), front-neck-left ... front-center-left
// = frontRight half + back + frontLeft half
const COLLAR_W = NECK_COLS * 2 + 1; // vertex count along collar
function placeCollar() {
  const W = COLLAR_W, H = COLLAR_ROWS + 1;
  const ids = new Int32Array(W * H);
  for (let iy = 0; iy < H; iy++) {
    const v = iy / COLLAR_ROWS;
    for (let ix = 0; ix < W; ix++) {
      const s = ix / (W - 1); // 0 front-center -> around the LEFT+back -> 1 front-center. Gap at FRONT (zip).
      const ang = -lerp(Math.PI * 0.02, Math.PI * 1.98, s); // negative: heads toward -x first
      const r = NECK.r + 0.016 + v * 0.004;
      const x = Math.sin(ang) * r * 1.12;
      const z = NECK.z0 + 0.004 + Math.cos(ang) * r * (Math.cos(ang) > 0 ? 1.06 : 0.98);
      const y = lerp(NECK.y0 - 0.012, NECK.y0 - 0.012 + COLLAR_H, v) + (Math.cos(ang) > 0 ? -0.028 * (1 - Math.abs(Math.sin(ang))) : 0.004);
      ids[iy * W + ix] = addVert(x, y, z, s * 0.5, v * COLLAR_H, 4, 0.35);
    }
  }
  return ids;
}
const cIds = placeCollar();

const N = px.length;
const pos = new Float32Array(N * 3);
const prev = new Float32Array(N * 3);
for (let i = 0; i < N; i++) {
  pos[i * 3] = px[i]; pos[i * 3 + 1] = py[i]; pos[i * 3 + 2] = pz[i];
  prev[i * 3] = px[i]; prev[i * 3 + 1] = py[i]; prev[i * 3 + 2] = pz[i];
}
const gScale = Float32Array.from(gravScale);

// ---------------------------------------------------------------- constraints
const conA = [], conB = [], conRest = [], conK = [];
function addCon(a, b, k, restOverride = null) {
  const r = restOverride ?? Math.hypot(patX[a] - patX[b], patY[a] - patY[b]);
  if (r < 1e-7) return;
  conA.push(a); conB.push(b); conRest.push(r); conK.push(k);
}
function gridConstraints(ids, W, H, kStruct, kShear, kBend, wrap = false) {
  const at = (ix, iy) => ids[iy * W + (wrap ? ((ix % (W - 1)) + (W - 1)) % (W - 1) : ix)];
  const lastX = wrap ? W - 1 : W;
  for (let iy = 0; iy < H; iy++) {
    for (let ix = 0; ix < lastX; ix++) {
      if (ix + 1 < lastX || wrap) addCon(at(ix, iy), at(ix + 1, iy), kStruct);
      if (iy + 1 < H) addCon(at(ix, iy), at(ix, iy + 1), kStruct);
      if (iy + 1 < H && (ix + 1 < lastX || wrap)) {
        addCon(at(ix, iy), at(ix + 1, iy + 1), kShear);
        addCon(at(ix + 1, iy), at(ix, iy + 1), kShear);
      }
      if (ix + 2 < lastX || wrap) addCon(at(ix, iy), at(ix + 2, iy), kBend);
      if (iy + 2 < H) addCon(at(ix, iy), at(ix, iy + 2), kBend);
    }
  }
}
gridConstraints(fIds, front.W, front.H, 1.0, 0.72, 0.30);
gridConstraints(bIds, back.W, back.H, 1.0, 0.72, 0.30);
gridConstraints(slIds, SLEEVE_AROUND + 1, SLEEVE_ALONG + 1, 1.0, 0.7, 0.26, false);
gridConstraints(srIds, SLEEVE_AROUND + 1, SLEEVE_ALONG + 1, 1.0, 0.7, 0.26, false);
gridConstraints(cIds, COLLAR_W, COLLAR_ROWS + 1, 1.0, 0.9, 0.9);
// sleeve tube wrap seam (join first and last column, they're duplicates in UV)
for (let iy = 0; iy <= SLEEVE_ALONG; iy++) {
  addCon(slIds[iy * (SLEEVE_AROUND + 1)], slIds[iy * (SLEEVE_AROUND + 1) + SLEEVE_AROUND], 1.0, 0);
  addCon(srIds[iy * (SLEEVE_AROUND + 1)], srIds[iy * (SLEEVE_AROUND + 1) + SLEEVE_AROUND], 1.0, 0);
}

// ---------------------------------------------------------------- sewing
const sewA = [], sewB = [];
function sew(a, b) { sewA.push(a); sewB.push(b); }
// side seams: rows 0..SIDE_ROWS on columns 0 (left) and NS (right)
for (let iy = 0; iy <= SIDE_ROWS; iy++) {
  sew(fIds[iy * front.W + 0], bIds[iy * back.W + 0]);
  sew(fIds[iy * front.W + NS], bIds[iy * back.W + NS]);
}
// shoulder seams: top row, columns 0..SHOULDER_COLS and NS-SHOULDER_COLS..NS
for (let ix = 0; ix <= SHOULDER_COLS; ix++) {
  sew(fIds[NT * front.W + ix], bIds[NT * back.W + ix]);
  sew(fIds[NT * front.W + (NS - ix)], bIds[NT * back.W + (NS - ix)]);
}
// armhole ring <-> sleeve top ring.
// armhole loop (left side): start underarm-front, go up front armhole to shoulder tip,
// then down back armhole to underarm. front left chain = column 0 rows SIDE_ROWS..NT.
function armholeLoop(ids, W, colIdx) {
  const upFront = [];
  for (let iy = SIDE_ROWS; iy <= NT; iy++) upFront.push(ids[iy * W + colIdx]);
  return upFront;
}
{
  // LEFT: sleeve ring ix: 0 = underarm; increasing a wraps over front (cap) — map:
  const frontArm = armholeLoop(fIds, front.W, 0);       // underarm..shoulderTip (27 pts)
  const backArm = armholeLoop(bIds, back.W, 0);         // underarm..shoulderTip
  // ring order: frontArm[0..ARM_ROWS] then backArm[ARM_ROWS-1..0]
  const ring = [...frontArm, ...backArm.slice(0, -1).reverse()];
  const W = SLEEVE_AROUND + 1;
  for (let ix = 0; ix < ring.length && ix < W; ix++) sew(slIds[0 * W + ix], ring[ix % ring.length]);
}
{
  // RIGHT side: the tube's angular circulation is mirrored, so walk the ring backwards
  const frontArm = armholeLoop(fIds, front.W, NS);
  const backArm = armholeLoop(bIds, back.W, NS);
  const ring = [...frontArm, ...backArm.slice(0, -1).reverse()].reverse();
  const W = SLEEVE_AROUND + 1;
  for (let ix = 0; ix < ring.length && ix < W; ix++) sew(srIds[0 * W + ix], ring[ix % ring.length]);
}
// collar bottom edge <-> neckline chain
// neckline: front columns SHOULDER_COLS..NS-SHOULDER_COLS on top row + back same.
// collar s: 0=front center right? our collar ix 0 -> ang -pi (front center, x<0 side sin(-pi)~0...)
// Simpler: build neck chain in the collar's angular order and sew 1:1.
{
  const frontNeck = [];
  for (let ix = SHOULDER_COLS; ix <= NS - SHOULDER_COLS; ix++) frontNeck.push(fIds[NT * front.W + ix]);
  const backNeck = [];
  for (let ix = SHOULDER_COLS; ix <= NS - SHOULDER_COLS; ix++) backNeck.push(bIds[NT * back.W + ix]);
  // collar ang -pi..pi where ang 0 = +z front? cos(ang)>0 is front. ang=-pi is BACK-left...
  // collar ix runs ang -0.985pi .. +0.985pi; x = sin(ang)*r.
  // ang ~ -pi: x~0-, z back  => back center.  That's wrong for a front zip!
  // Fix: collar was placed with gap at back; rotate mapping: we want gap at FRONT.
  // We re-place collar angles so ix 0 -> front-center-left going around the back.
  // (Handled in placeCollar via ang offset below — see COLLAR_ANG_OFFSET.)
  const centerF = Math.floor(frontNeck.length / 2);
  // neck chain matching collar ix order: front center-left -> left shoulder -> back (L->R... )
  // collar ang(ix): -0.985pi -> +0.985pi with sin/cos: ang=-pi => (x~0, z~-r)?? cos(-pi)=-1 back.
  // We need chain starting front-center offset. Construct by angle sampling instead:
  const chain = [
    ...frontNeck.slice(0, centerF + 1).reverse(), // front center -> front left
    ...backNeck,                                   // back left -> back right? (back panel cols L->R)
    ...frontNeck.slice(centerF).reverse(),         // front right -> front center
  ];
  // resample chain indices to COLLAR_W by nearest
  for (let ix = 0; ix < COLLAR_W; ix++) {
    const t = ix / (COLLAR_W - 1);
    const j = Math.round(t * (chain.length - 1));
    sew(cIds[0 * COLLAR_W + ix], chain[j]);
  }
}

const NSEW = sewA.length;
console.log(`verts=${N} constraints=${conA.length} sewing=${NSEW}`);

// ---------------------------------------------------------------- solver
const CA = Int32Array.from(conA), CB = Int32Array.from(conB);
const CR = Float32Array.from(conRest), CK = Float32Array.from(conK);
const SA = Int32Array.from(sewA), SB = Int32Array.from(sewB);
const NC = CA.length;

const STEPS = process.argv.includes('--steps')
  ? parseInt(process.argv[process.argv.indexOf('--steps') + 1], 10)
  : 950;
const DT = 1 / 60;
const ITER = 9;
const grad = [0, 0, 0];

// Fitting pins. Sequence: assemble (sew, no gravity) -> project the shoulder
// seam down onto the trapezius and pin it (shirt "fitted on the form") ->
// relax -> freeze the collar ring rigid (a real zip collar is interfaced and
// crisp) -> gravity drape. Pins re-engage identically after checkpoint resume
// because pinned verts cannot have moved.
const pinned = new Uint8Array(N);
const pinPos = new Float32Array(N * 3);
let shouldersPinned = false;
let collarPinned = false;
function pinVert(v) {
  pinned[v] = 1;
  pinPos[v * 3] = pos[v * 3]; pinPos[v * 3 + 1] = pos[v * 3 + 1]; pinPos[v * 3 + 2] = pos[v * 3 + 2];
}
function pinShoulders() {
  const g = [0, 0, 0];
  const seamVerts = [];
  for (let ix = 0; ix <= SHOULDER_COLS; ix++) {
    for (const ids of [fIds, bIds]) {
      const W = front.W;
      for (const col of [ix, NS - ix]) seamVerts.push(ids[NT * W + col]);
    }
  }
  // seat the whole garment: average shoulder-seam clearance -> translate down
  let avg = 0, cnt = 0;
  for (const v of seamVerts) {
    const d = mannequinSDF(pos[v * 3], pos[v * 3 + 1], pos[v * 3 + 2]);
    if (d < 0.15 && d > -0.01) { avg += d; cnt++; }
  }
  const drop = cnt ? Math.max(0, avg / cnt - 0.007) : 0;
  if (drop > 0.001) {
    for (let i = 0; i < N; i++) { pos[i * 3 + 1] -= drop; prev[i * 3 + 1] -= drop; }
  }
  let pinnedCount = 0;
  for (const v of seamVerts) {
    const d = mannequinSDF(pos[v * 3], pos[v * 3 + 1], pos[v * 3 + 2]);
    if (d > 0.05 || d < -0.01) continue; // over a void or inside: leave free
    mannequinGrad(pos[v * 3], pos[v * 3 + 1], pos[v * 3 + 2], g);
    const move = d - 0.007;
    pos[v * 3] -= g[0] * move; pos[v * 3 + 1] -= g[1] * move; pos[v * 3 + 2] -= g[2] * move;
    prev[v * 3] = pos[v * 3]; prev[v * 3 + 1] = pos[v * 3 + 1]; prev[v * 3 + 2] = pos[v * 3 + 2];
    pinVert(v);
    pinnedCount++;
  }
  console.log(`pinShoulders: seated drop=${(drop * 1000).toFixed(1)}mm pinned=${pinnedCount}/${seamVerts.length}`);
  shouldersPinned = true;
}
function pinCollar() {
  for (let iy = 0; iy <= COLLAR_ROWS; iy++) {
    for (let ix = 0; ix < COLLAR_W; ix++) pinVert(cIds[iy * COLLAR_W + ix]);
  }
  collarPinned = true;
}
function applyPins() {
  for (let i = 0; i < N; i++) {
    if (pinned[i]) {
      pos[i * 3] = pinPos[i * 3]; pos[i * 3 + 1] = pinPos[i * 3 + 1]; pos[i * 3 + 2] = pinPos[i * 3 + 2];
      prev[i * 3] = pinPos[i * 3]; prev[i * 3 + 1] = pinPos[i * 3 + 1]; prev[i * 3 + 2] = pinPos[i * 3 + 2];
    }
  }
}

function step(si) {
  const assemble = smooth(0, 240, si);            // sewing ramp
  // gentle settling gravity during assembly stops collision-pump creep; full
  // gravity only after the fitting pins are set
  const g = -1.2 * smooth(60, 160, si) - 8.6 * smooth(340, 500, si);
  const damp = si < 240 ? 0.90 : si < 750 ? 0.985 : 0.90;

  // integrate
  for (let i = 0; i < N; i++) {
    const i3 = i * 3;
    const vx = (pos[i3] - prev[i3]) * damp;
    const vy = (pos[i3 + 1] - prev[i3 + 1]) * damp;
    const vz = (pos[i3 + 2] - prev[i3 + 2]) * damp;
    prev[i3] = pos[i3]; prev[i3 + 1] = pos[i3 + 1]; prev[i3 + 2] = pos[i3 + 2];
    pos[i3] += vx;
    pos[i3 + 1] += vy + g * gScale[i] * DT * DT;
    pos[i3 + 2] += vz;
  }
  // small organic perturbation once, to seed natural folds
  if (si === 500) {
    for (let i = 0; i < N; i++) {
      pos[i * 3] += (rand() - 0.5) * 0.0025;
      pos[i * 3 + 2] += (rand() - 0.5) * 0.0025;
    }
  }
  if (si >= 250 && !shouldersPinned) pinShoulders(); // both also re-engage after resume
  if (si >= 335 && !collarPinned) pinCollar();

  for (let it = 0; it < ITER; it++) {
    // distance constraints (pin-aware: pinned verts have zero inverse mass)
    for (let c = 0; c < NC; c++) {
      const va = CA[c], vb = CB[c];
      const pa = pinned[va], pb = pinned[vb];
      if (pa && pb) continue;
      const a3 = va * 3, b3 = vb * 3;
      const dx = pos[b3] - pos[a3], dy = pos[b3 + 1] - pos[a3 + 1], dz = pos[b3 + 2] - pos[a3 + 2];
      const d = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1e-9;
      const wa = pa ? 0 : (pb ? 1 : 0.5);
      const diff = (d - CR[c]) / d * CK[c];
      const ox = dx * diff, oy = dy * diff, oz = dz * diff;
      const wb = pb ? 0 : 1 - wa;
      pos[a3] += ox * wa; pos[a3 + 1] += oy * wa; pos[a3 + 2] += oz * wa;
      pos[b3] -= ox * wb; pos[b3 + 1] -= oy * wb; pos[b3 + 2] -= oz * wb;
    }
    // sewing (pin-aware)
    const sk = 0.35 * assemble;
    for (let s = 0; s < NSEW; s++) {
      const va = SA[s], vb = SB[s];
      const pa = pinned[va], pb = pinned[vb];
      if (pa && pb) continue;
      const a3 = va * 3, b3 = vb * 3;
      const wa = pa ? 0 : (pb ? 1 : 0.5);
      const dx = (pos[b3] - pos[a3]) * sk;
      const dy = (pos[b3 + 1] - pos[a3 + 1]) * sk;
      const dz = (pos[b3 + 2] - pos[a3 + 2]) * sk;
      pos[a3] += dx * wa; pos[a3 + 1] += dy * wa; pos[a3 + 2] += dz * wa;
      const fb = pb ? 0 : 1 - wa;
      pos[b3] -= dx * fb; pos[b3 + 1] -= dy * fb; pos[b3 + 2] -= dz * fb;
    }
    // collision (every other iteration for speed, always on last)
    if ((it & 1) === 1 || it === ITER - 1) {
      const OFF = 0.006;
      for (let i = 0; i < N; i++) {
        const i3 = i * 3;
        const d = mannequinSDF(pos[i3], pos[i3 + 1], pos[i3 + 2]);
        if (d < OFF) {
          mannequinGrad(pos[i3], pos[i3 + 1], pos[i3 + 2], grad);
          const push = OFF - d;
          pos[i3] += grad[0] * push;
          pos[i3 + 1] += grad[1] * push;
          pos[i3 + 2] += grad[2] * push;
          // near-static friction: cloth grips the form
          prev[i3] = lerp(prev[i3], pos[i3], 0.85);
          prev[i3 + 1] = lerp(prev[i3 + 1], pos[i3 + 1], 0.85);
          prev[i3 + 2] = lerp(prev[i3 + 2], pos[i3 + 2], 0.85);
        }
      }
    }
    if (shouldersPinned || collarPinned) applyPins();
  }
}

// --- chunked execution: each sandbox call is time-limited, so the sim can
// checkpoint (--save-state F after --budget seconds) and resume (--load-state F).
const STATE = process.argv.includes('--state')
  ? process.argv[process.argv.indexOf('--state') + 1]
  : null;
const BUDGET = process.argv.includes('--budget')
  ? parseFloat(process.argv[process.argv.indexOf('--budget') + 1]) * 1000
  : Infinity;
let startStep = 0;
if (STATE && fs.existsSync(STATE)) {
  const raw = fs.readFileSync(STATE);
  startStep = raw.readUInt32LE(0);
  const p = new Float32Array(raw.buffer, raw.byteOffset + 4, N * 3);
  const q = new Float32Array(raw.buffer, raw.byteOffset + 4 + N * 12, N * 3);
  pos.set(p); prev.set(q);
  console.log(`resumed at step ${startStep}`);
}
console.time('sim');
const t0 = Date.now();
let si = startStep;
for (; si < STEPS; si++) {
  step(si);
  if (si % 50 === 0) {
    let ke = 0, cy = 0;
    for (let i = 0; i < N * 3; i++) { const v = pos[i] - prev[i]; ke += v * v; }
    for (let i = 0; i < N; i++) cy += pos[i * 3 + 1];
    console.log(`step ${si} ke=${ke.toExponential(2)} cy=${(cy / N).toFixed(3)}`);
  }
  if (Date.now() - t0 > BUDGET) break;
}
console.timeEnd('sim');
if (si < STEPS) {
  const raw = Buffer.alloc(4 + N * 24);
  raw.writeUInt32LE(si + 1, 0);
  Buffer.from(pos.buffer, pos.byteOffset, N * 12).copy(raw, 4);
  Buffer.from(prev.buffer, prev.byteOffset, N * 12).copy(raw, 4 + N * 12);
  fs.writeFileSync(STATE, raw);
  console.log(`CHECKPOINT ${si + 1}/${STEPS}`);
  process.exit(0);
}
if (STATE && fs.existsSync(STATE)) fs.unlinkSync(STATE);

// ---------------------------------------------------------------- weld + mesh assembly
// Weld sewing pairs positionally (average), keep vertices separate (UV islands),
// but record weld groups so normals merge across seams.
const weldRoot = new Int32Array(N).fill(-1);
function rootOf(i) { let r = i; while (weldRoot[r] >= 0) r = weldRoot[r]; return r; }
for (let s = 0; s < NSEW; s++) {
  const ra = rootOf(SA[s]), rb = rootOf(SB[s]);
  if (ra !== rb) weldRoot[Math.max(ra, rb)] = Math.min(ra, rb);
}
// snap welded positions to their group mean
{
  const sum = new Float64Array(N * 3), cnt = new Int32Array(N);
  for (let i = 0; i < N; i++) {
    const r = rootOf(i);
    sum[r * 3] += pos[i * 3]; sum[r * 3 + 1] += pos[i * 3 + 1]; sum[r * 3 + 2] += pos[i * 3 + 2];
    cnt[r]++;
  }
  for (let i = 0; i < N; i++) {
    const r = rootOf(i);
    pos[i * 3] = sum[r * 3] / cnt[r];
    pos[i * 3 + 1] = sum[r * 3 + 1] / cnt[r];
    pos[i * 3 + 2] = sum[r * 3 + 2] / cnt[r];
  }
}

// triangles per panel grid
function gridTriangles(ids, W, H) {
  const idx = [];
  for (let iy = 0; iy < H - 1; iy++) {
    for (let ix = 0; ix < W - 1; ix++) {
      const a = ids[iy * W + ix], b = ids[iy * W + ix + 1];
      const c = ids[(iy + 1) * W + ix], d = ids[(iy + 1) * W + ix + 1];
      idx.push(a, b, c, b, d, c);
    }
  }
  return idx;
}
const triFront = gridTriangles(fIds, front.W, front.H);
const triBack = gridTriangles(bIds, back.W, back.H);
const triSL = gridTriangles(slIds, SLEEVE_AROUND + 1, SLEEVE_ALONG + 1);
const triSR = gridTriangles(srIds, SLEEVE_AROUND + 1, SLEEVE_ALONG + 1);
const triCollar = gridTriangles(cIds, COLLAR_W, COLLAR_ROWS + 1);

// fix winding so normals face OUT.
// front panel: +z out, grid x increases with +x -> default winding ok? We'll compute
// and flip per-panel via test triangle after normal calc if needed (see below).

// smooth normals with weld merging
const allTris = [...triFront, ...triBack, ...triSL, ...triSR, ...triCollar];
function computeNormals(indexArr) {
  const nrm = new Float32Array(N * 3);
  for (let t = 0; t < indexArr.length; t += 3) {
    const a = indexArr[t] * 3, b = indexArr[t + 1] * 3, c = indexArr[t + 2] * 3;
    const abx = pos[b] - pos[a], aby = pos[b + 1] - pos[a + 1], abz = pos[b + 2] - pos[a + 2];
    const acx = pos[c] - pos[a], acy = pos[c + 1] - pos[a + 1], acz = pos[c + 2] - pos[a + 2];
    const nx = aby * acz - abz * acy, ny = abz * acx - abx * acz, nz = abx * acy - aby * acx;
    for (const v of [indexArr[t], indexArr[t + 1], indexArr[t + 2]]) {
      const r = rootOf(v) * 3;
      nrm[r] += nx; nrm[r + 1] += ny; nrm[r + 2] += nz;
    }
  }
  for (let i = 0; i < N; i++) {
    const r = rootOf(i) * 3, i3 = i * 3;
    const l = Math.hypot(nrm[r], nrm[r + 1], nrm[r + 2]) || 1e-9;
    nrm[i3] = nrm[r] / l; nrm[i3 + 1] = nrm[r + 1] / l; nrm[i3 + 2] = nrm[r + 2] / l;
  }
  return nrm;
}
// orientation check: does the front panel normal face +z? sample center vertex
function panelNeedsFlip(ids, W, H, expectDir) {
  const i = ids[Math.floor(H / 2) * W + Math.floor(W / 2)];
  // face normal of a local quad
  const a = ids[Math.floor(H / 2) * W + Math.floor(W / 2)] * 3;
  const b = ids[Math.floor(H / 2) * W + Math.floor(W / 2) + 1] * 3;
  const c = ids[(Math.floor(H / 2) + 1) * W + Math.floor(W / 2)] * 3;
  const abx = pos[b] - pos[a], aby = pos[b + 1] - pos[a + 1], abz = pos[b + 2] - pos[a + 2];
  const acx = pos[c] - pos[a], acy = pos[c + 1] - pos[a + 1], acz = pos[c + 2] - pos[a + 2];
  const nx = aby * acz - abz * acy, ny = abz * acx - abx * acz, nz = abx * acy - aby * acx;
  return (nx * expectDir[0] + ny * expectDir[1] + nz * expectDir[2]) < 0;
}
function flipTris(tris) {
  for (let t = 0; t < tris.length; t += 3) { const tmp = tris[t + 1]; tris[t + 1] = tris[t + 2]; tris[t + 2] = tmp; }
}
if (panelNeedsFlip(fIds, front.W, front.H, [0, 0, 1])) flipTris(triFront);
if (panelNeedsFlip(bIds, back.W, back.H, [0, 0, -1])) flipTris(triBack);
// sleeves: outward = away from arm axis; sample at outer side (a=pi/2 → ix=SLEEVE_AROUND/4)
{
  const W = SLEEVE_AROUND + 1;
  const iy = Math.floor(SLEEVE_ALONG / 2);
  for (const [ids, tris, sgn] of [[slIds, triSL, -1], [srIds, triSR, 1]]) {
    const iTop = ids[iy * W + Math.floor(SLEEVE_AROUND / 2)]; // shoulder-side point (a=pi → up)
    // expected normal ~ up-ish
    const a = iTop * 3;
    const b = ids[iy * W + Math.floor(SLEEVE_AROUND / 2) + 1] * 3;
    const c = ids[(iy + 1) * W + Math.floor(SLEEVE_AROUND / 2)] * 3;
    const abx = pos[b] - pos[a], aby = pos[b + 1] - pos[a + 1], abz = pos[b + 2] - pos[a + 2];
    const acx = pos[c] - pos[a], acy = pos[c + 1] - pos[a + 1], acz = pos[c + 2] - pos[a + 2];
    const ny = abz * acx - abx * acz;
    if (ny < 0) flipTris(tris);
  }
}
// collar: outward = away from neck axis (radial). sample back of collar (mid ix)
{
  const iy = Math.floor(COLLAR_ROWS / 2);
  const mid = Math.floor(COLLAR_W / 2);
  const i = cIds[iy * COLLAR_W + mid] * 3;
  const b = cIds[iy * COLLAR_W + mid + 1] * 3;
  const c = cIds[(iy + 1) * COLLAR_W + mid] * 3;
  const abx = pos[b] - pos[i], aby = pos[b + 1] - pos[i + 1], abz = pos[b + 2] - pos[i + 2];
  const acx = pos[c] - pos[i], acy = pos[c + 1] - pos[i + 1], acz = pos[c + 2] - pos[i + 2];
  const nz = abx * acy - aby * acx;
  // back of collar: outward is -z
  if (nz > 0) flipTris(triCollar);
}

const normals = computeNormals([...triFront, ...triBack, ...triSL, ...triSR, ...triCollar]);

// seam accent: slight inward pinch along seams (reads as stitched seam)
for (let s = 0; s < NSEW; s++) {
  for (const v of [SA[s], SB[s]]) {
    const i3 = v * 3;
    pos[i3] -= normals[i3] * 0.0016;
    pos[i3 + 1] -= normals[i3 + 1] * 0.0016;
    pos[i3 + 2] -= normals[i3 + 2] * 0.0016;
  }
}

// ---------------------------------------------------------------- UVs (atlas, must match lib/compositor.ts v2)
const ATLAS = 2048;
const PXM = 1700; // px per meter
// island origins (px): see compositor v2
const ISL = {
  front: { x: 20, y: 460, w: 986, h: 1309 },
  back: { x: 1042, y: 460, w: 986, h: 1309 },
  sleeveL: { x: 24, y: 24, w: 748, h: 400 },
  sleeveR: { x: 800, y: 24, w: 748, h: 400 },
};
const uv = new Float32Array(N * 2);
function assignBodyUV(ids, W, H, isl, flipX) {
  // pattern bbox
  let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
  for (let k = 0; k < W * H; k++) {
    const i = ids[k];
    minX = Math.min(minX, patX[i]); maxX = Math.max(maxX, patX[i]);
    minY = Math.min(minY, patY[i]); maxY = Math.max(maxY, patY[i]);
  }
  const cw = (maxX - minX) * PXM, ch = (maxY - minY) * PXM;
  const ox = isl.x + (isl.w - cw) / 2, oy = isl.y + (isl.h - ch) / 2;
  for (let k = 0; k < W * H; k++) {
    const i = ids[k];
    const lx = flipX ? (maxX - patX[i]) : (patX[i] - minX);
    const ly = maxY - patY[i]; // canvas y down
    uv[i * 2] = (ox + lx * PXM) / ATLAS;
    uv[i * 2 + 1] = 1 - (oy + ly * PXM) / ATLAS;
  }
}
assignBodyUV(fIds, front.W, front.H, ISL.front, false);
assignBodyUV(bIds, back.W, back.H, ISL.back, true); // back as seen from behind
assignBodyUV(slIds, SLEEVE_AROUND + 1, SLEEVE_ALONG + 1, ISL.sleeveL, false);
assignBodyUV(srIds, SLEEVE_AROUND + 1, SLEEVE_ALONG + 1, ISL.sleeveR, true);
// collar UVs: simple 0..1 strip (solid material, doesn't matter much)
for (let iy = 0; iy <= COLLAR_ROWS; iy++) {
  for (let ix = 0; ix < COLLAR_W; ix++) {
    const i = cIds[iy * COLLAR_W + ix];
    uv[i * 2] = ix / (COLLAR_W - 1);
    uv[i * 2 + 1] = iy / COLLAR_ROWS;
  }
}

// ---------------------------------------------------------------- AO bake (per-vertex, garment only)
// uniform grid accelerator over all triangles
console.time('ao');
const tris = allTris; // NOTE: winding irrelevant for occlusion
const triCount = tris.length / 3;
let bbMin = [1e9, 1e9, 1e9], bbMax = [-1e9, -1e9, -1e9];
for (let i = 0; i < N; i++) {
  for (let k = 0; k < 3; k++) {
    bbMin[k] = Math.min(bbMin[k], pos[i * 3 + k]);
    bbMax[k] = Math.max(bbMax[k], pos[i * 3 + k]);
  }
}
const GRID = 48;
const cellOf = (x, y, z) => {
  const gx = clamp(Math.floor(((x - bbMin[0]) / (bbMax[0] - bbMin[0] + 1e-9)) * GRID), 0, GRID - 1);
  const gy = clamp(Math.floor(((y - bbMin[1]) / (bbMax[1] - bbMin[1] + 1e-9)) * GRID), 0, GRID - 1);
  const gz = clamp(Math.floor(((z - bbMin[2]) / (bbMax[2] - bbMin[2] + 1e-9)) * GRID), 0, GRID - 1);
  return (gx * GRID + gy) * GRID + gz;
};
const cells = new Array(GRID * GRID * GRID);
for (let t = 0; t < triCount; t++) {
  const a = tris[t * 3] * 3, b = tris[t * 3 + 1] * 3, c = tris[t * 3 + 2] * 3;
  const minx = Math.min(pos[a], pos[b], pos[c]), maxx = Math.max(pos[a], pos[b], pos[c]);
  const miny = Math.min(pos[a + 1], pos[b + 1], pos[c + 1]), maxy = Math.max(pos[a + 1], pos[b + 1], pos[c + 1]);
  const minz = Math.min(pos[a + 2], pos[b + 2], pos[c + 2]), maxz = Math.max(pos[a + 2], pos[b + 2], pos[c + 2]);
  const g0 = [minx, miny, minz].map((v, k) => clamp(Math.floor(((v - bbMin[k]) / (bbMax[k] - bbMin[k] + 1e-9)) * GRID), 0, GRID - 1));
  const g1 = [maxx, maxy, maxz].map((v, k) => clamp(Math.floor(((v - bbMin[k]) / (bbMax[k] - bbMin[k] + 1e-9)) * GRID), 0, GRID - 1));
  for (let gx = g0[0]; gx <= g1[0]; gx++)
    for (let gy = g0[1]; gy <= g1[1]; gy++)
      for (let gz = g0[2]; gz <= g1[2]; gz++) {
        const key = (gx * GRID + gy) * GRID + gz;
        (cells[key] ||= []).push(t);
      }
}
function rayTri(ox, oy, oz, dx, dy, dz, t) {
  const a = tris[t * 3] * 3, b = tris[t * 3 + 1] * 3, c = tris[t * 3 + 2] * 3;
  const e1x = pos[b] - pos[a], e1y = pos[b + 1] - pos[a + 1], e1z = pos[b + 2] - pos[a + 2];
  const e2x = pos[c] - pos[a], e2y = pos[c + 1] - pos[a + 1], e2z = pos[c + 2] - pos[a + 2];
  const px_ = dy * e2z - dz * e2y, py_ = dz * e2x - dx * e2z, pz_ = dx * e2y - dy * e2x;
  const det = e1x * px_ + e1y * py_ + e1z * pz_;
  if (det > -1e-9 && det < 1e-9) return -1;
  const inv = 1 / det;
  const tx = ox - pos[a], ty = oy - pos[a + 1], tz = oz - pos[a + 2];
  const u = (tx * px_ + ty * py_ + tz * pz_) * inv;
  if (u < 0 || u > 1) return -1;
  const qx = ty * e1z - tz * e1y, qy = tz * e1x - tx * e1z, qz = tx * e1y - ty * e1x;
  const v = (dx * qx + dy * qy + dz * qz) * inv;
  if (v < 0 || u + v > 1) return -1;
  const hit = (e2x * qx + e2y * qy + e2z * qz) * inv;
  return hit > 1e-5 ? hit : -1;
}
const AO_MAXD = 0.22;
function occluded(ox, oy, oz, dx, dy, dz) {
  // DDA through grid up to AO_MAXD
  let t = 0;
  const stepLen = Math.min(bbMax[0] - bbMin[0], bbMax[1] - bbMin[1], bbMax[2] - bbMin[2]) / GRID * 0.9;
  const seen = new Set();
  while (t < AO_MAXD) {
    const cx = ox + dx * t, cy = oy + dy * t, cz = oz + dz * t;
    if (cx < bbMin[0] - 0.01 || cx > bbMax[0] + 0.01 || cy < bbMin[1] - 0.01 || cy > bbMax[1] + 0.01 || cz < bbMin[2] - 0.01 || cz > bbMax[2] + 0.01) break;
    const key = cellOf(cx, cy, cz);
    if (!seen.has(key)) {
      seen.add(key);
      const list = cells[key];
      if (list) {
        for (let li = 0; li < list.length; li++) {
          const hit = rayTri(ox, oy, oz, dx, dy, dz, list[li]);
          if (hit > 0 && hit < AO_MAXD) return Math.max(0, 1 - hit / AO_MAXD);
        }
      }
    }
    t += stepLen;
  }
  return 0;
}
const AO_RAYS = 40;
const aoDirs = [];
for (let i = 0; i < AO_RAYS; i++) {
  // cosine-weighted hemisphere (z up), fibonacci
  const phi = i * 2.399963;
  const r2 = (i + 0.5) / AO_RAYS;
  const rr = Math.sqrt(r2);
  aoDirs.push([rr * Math.cos(phi), rr * Math.sin(phi), Math.sqrt(1 - r2)]);
}
const ao = new Float32Array(N).fill(1);
{
  // build tangent frames per vertex and cast
  for (let i = 0; i < N; i++) {
    const i3 = i * 3;
    const nx = normals[i3], ny = normals[i3 + 1], nz = normals[i3 + 2];
    // tangent
    let tx = 1, ty = 0, tz = 0;
    if (Math.abs(nx) > 0.9) { tx = 0; ty = 1; }
    let bx = ny * tz - nz * ty, by = nz * tx - nx * tz, bz = nx * ty - ny * tx;
    const bl = Math.hypot(bx, by, bz) || 1;
    bx /= bl; by /= bl; bz /= bl;
    tx = by * nz - bz * ny; ty = bz * nx - bx * nz; tz = bx * ny - by * nx;
    const ox = pos[i3] + nx * 0.004, oy = pos[i3 + 1] + ny * 0.004, oz = pos[i3 + 2] + nz * 0.004;
    let occ = 0;
    for (let r = 0; r < AO_RAYS; r++) {
      const d = aoDirs[r];
      const dx = tx * d[0] + bx * d[1] + nx * d[2];
      const dy = ty * d[0] + by * d[1] + ny * d[2];
      const dz = tz * d[0] + bz * d[1] + nz * d[2];
      occ += occluded(ox, oy, oz, dx, dy, dz);
    }
    ao[i] = clamp(1 - (occ / AO_RAYS) * 0.85, 0.25, 1);
  }
}
// darken seams a touch (stitch shadow)
for (let s = 0; s < NSEW; s++) {
  ao[SA[s]] *= 0.93; ao[SB[s]] *= 0.93;
}
console.timeEnd('ao');

// ---------------------------------------------------------------- trim geometry (bands, zipper)
// generic quadstrip builder from a polyline of {p:[x,y,z], n:[x,y,z]} with width dir along t
const extraMeshes = [];
function stripMesh(name, material, centers, normalsArr, halfW, lift = 0.0015) {
  const M = centers.length;
  const vp = new Float32Array(M * 2 * 3);
  const vn = new Float32Array(M * 2 * 3);
  const vuv = new Float32Array(M * 2 * 2);
  const vao = new Float32Array(M * 2).fill(1);
  const idx = [];
  for (let i = 0; i < M; i++) {
    const c = centers[i], n = normalsArr[i];
    const next = centers[Math.min(i + 1, M - 1)];
    const prevC = centers[Math.max(i - 1, 0)];
    let tx = next[0] - prevC[0], ty = next[1] - prevC[1], tz = next[2] - prevC[2];
    const tl = Math.hypot(tx, ty, tz) || 1; tx /= tl; ty /= tl; tz /= tl;
    // side = t x n
    let sx = ty * n[2] - tz * n[1], sy = tz * n[0] - tx * n[2], sz = tx * n[1] - ty * n[0];
    const sl = Math.hypot(sx, sy, sz) || 1; sx /= sl; sy /= sl; sz /= sl;
    for (let k = 0; k < 2; k++) {
      const sgn = k === 0 ? -1 : 1;
      const o = (i * 2 + k) * 3;
      vp[o] = c[0] + sx * halfW * sgn + n[0] * lift;
      vp[o + 1] = c[1] + sy * halfW * sgn + n[1] * lift;
      vp[o + 2] = c[2] + sz * halfW * sgn + n[2] * lift;
      vn[o] = n[0]; vn[o + 1] = n[1]; vn[o + 2] = n[2];
      vuv[(i * 2 + k) * 2] = i / (M - 1); vuv[(i * 2 + k) * 2 + 1] = k;
    }
    if (i < M - 1) {
      const a = i * 2, b = i * 2 + 1, c2 = i * 2 + 2, d = i * 2 + 3;
      idx.push(a, b, c2, b, d, c2);
    }
  }
  extraMeshes.push({ name, material, pos: vp, nrm: vn, uv: vuv, ao: vao, idx: Uint32Array.from(idx) });
}

// sleeve cuff bands: follow last sleeve row
function ringOf(ids, W, row) {
  const centers = [], nrms = [];
  for (let ix = 0; ix <= SLEEVE_AROUND; ix++) {
    const i = ids[row * W + ix];
    centers.push([pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]]);
    nrms.push([normals[i * 3], normals[i * 3 + 1], normals[i * 3 + 2]]);
  }
  return [centers, nrms];
}
{
  const W = SLEEVE_AROUND + 1;
  const [cL, nL] = ringOf(slIds, W, SLEEVE_ALONG);
  stripMesh('cuffL', 'cuff', cL, nL, 0.011, 0.0018);
  const [cR, nR] = ringOf(srIds, W, SLEEVE_ALONG);
  stripMesh('cuffR', 'cuff', cR, nR, 0.011, 0.0018);
}
// bottom hem band
{
  const centers = [], nrms = [];
  for (let ix = 0; ix <= NS; ix++) {
    const i = fIds[0 * front.W + ix];
    centers.push([pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]]);
    nrms.push([normals[i * 3], normals[i * 3 + 1], normals[i * 3 + 2]]);
  }
  for (let ix = NS; ix >= 0; ix--) {
    const i = bIds[0 * back.W + ix];
    centers.push([pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]]);
    nrms.push([normals[i * 3], normals[i * 3 + 1], normals[i * 3 + 2]]);
  }
  centers.push(centers[0]); nrms.push(nrms[0]);
  stripMesh('hem', 'cuff', centers, nrms, 0.010, 0.0016);
}

// zipper: collar front edges + body center line below neck
function zipperLine() {
  const line = [], lineN = [];
  // collar right front edge top->bottom (ix = COLLAR_W-1)... front center columns are ix=0 / COLLAR_W-1
  for (let iy = COLLAR_ROWS; iy >= 0; iy--) {
    const iA = cIds[iy * COLLAR_W + 0];
    const iB = cIds[iy * COLLAR_W + (COLLAR_W - 1)];
    line.push([
      (pos[iA * 3] + pos[iB * 3]) / 2,
      (pos[iA * 3 + 1] + pos[iB * 3 + 1]) / 2,
      (pos[iA * 3 + 2] + pos[iB * 3 + 2]) / 2 + 0.001,
    ]);
    lineN.push([0, 0.15, 0.99]);
  }
  // body center front from neckline down ZIP_LEN
  const centerCol = Math.floor(NS / 2);
  const ZIP_LEN = 0.15;
  const topY = pos[fIds[NT * front.W + centerCol] * 3 + 1];
  for (let iy = NT; iy >= 0; iy--) {
    const i = fIds[iy * front.W + centerCol];
    const y = pos[i * 3 + 1];
    if (topY - y > ZIP_LEN) break;
    line.push([pos[i * 3], y, pos[i * 3 + 2]]);
    lineN.push([normals[i * 3], normals[i * 3 + 1], normals[i * 3 + 2]]);
  }
  return [line, lineN];
}
{
  const [line, lineN] = zipperLine();
  // tape (two strips flanking)
  stripMesh('zipTape', 'tape', line, lineN, 0.0105, 0.0022);
  // teeth: small boxes along the line
  const vp = [], vn = [], vuvArr = [], vao = [], idx = [];
  let vc = 0;
  function box(cx, cy, cz, n, t, w, h, d) {
    // local frame: n out, t along, s = t x n
    let sx = t[1] * n[2] - t[2] * n[1], sy = t[2] * n[0] - t[0] * n[2], sz = t[0] * n[1] - t[1] * n[0];
    const sl = Math.hypot(sx, sy, sz) || 1; sx /= sl; sy /= sl; sz /= sl;
    const corners = [];
    for (const [a, b, c] of [[-1, -1, 0], [1, -1, 0], [1, 1, 0], [-1, 1, 0], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]]) {
      corners.push([
        cx + sx * a * w / 2 + t[0] * b * h / 2 + n[0] * (c * d + 0.0018),
        cy + sy * a * w / 2 + t[1] * b * h / 2 + n[1] * (c * d + 0.0018),
        cz + sz * a * w / 2 + t[2] * b * h / 2 + n[2] * (c * d + 0.0018),
      ]);
    }
    const faces = [[4, 5, 6, 7], [1, 0, 3, 2], [0, 4, 7, 3], [5, 1, 2, 6], [7, 6, 2, 3], [0, 1, 5, 4]];
    for (const f of faces) {
      const base = vc;
      for (const ci of f) {
        vp.push(...corners[ci]); vn.push(n[0], n[1], n[2]); vuvArr.push(0, 0); vao.push(1); vc++;
      }
      idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
    }
  }
  // cumulative arclength placement
  let acc = 0;
  for (let i = 1; i < line.length; i++) {
    const a = line[i - 1], b = line[i];
    const seg = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
    let t = [b[0] - a[0], b[1] - a[1], b[2] - a[2]].map((v) => v / (seg || 1));
    acc += seg;
    while (acc > 0.0034) {
      acc -= 0.0034;
      const f = 1 - acc / seg;
      const cx = lerp(a[0], b[0], f), cy = lerp(a[1], b[1], f), cz = lerp(a[2], b[2], f);
      const n = lineN[i];
      box(cx, cy, cz, n, t, 0.0042, 0.0026, 0.0016);
    }
  }
  // slider: bigger box + puller
  const sTop = line[Math.floor(line.length * 0.32)];
  const sN = lineN[Math.floor(line.length * 0.32)];
  const sT = [0, -1, 0];
  box(sTop[0], sTop[1], sTop[2], sN, sT, 0.011, 0.016, 0.005);
  box(sTop[0], sTop[1] - 0.017, sTop[2] + 0.002, sN, sT, 0.008, 0.022, 0.002);
  extraMeshes.push({
    name: 'zipTeeth', material: 'metal',
    pos: Float32Array.from(vp), nrm: Float32Array.from(vn),
    uv: Float32Array.from(vuvArr), ao: Float32Array.from(vao), idx: Uint32Array.from(idx),
  });
}

// ---------------------------------------------------------------- optional mannequin debug mesh
if (process.argv.includes('--mann')) {
  const vp = [], vn = [], vuvArr = [], vao = [], idx = [];
  const SLICES = 64, STACKS = 90;
  const g = [0, 0, 0];
  for (let iy = 0; iy <= STACKS; iy++) {
    const y = lerp(-0.58, 0.68, iy / STACKS);
    for (let ix = 0; ix <= SLICES; ix++) {
      const th = (ix / SLICES) * Math.PI * 2;
      // march a ray outward from the spine to the isosurface
      let r = 0.005;
      for (let k = 0; k < 40; k++) {
        const d = mannequinSDF(Math.sin(th) * r, y, Math.cos(th) * r);
        if (d < 0.001) r += Math.max(d, 0.004); else { r += d * 0.9; if (d < 0.0015) break; }
        if (r > 0.6) break;
      }
      // refine
      for (let k = 0; k < 8; k++) {
        const d = mannequinSDF(Math.sin(th) * r, y, Math.cos(th) * r);
        r -= d * 0.8;
      }
      const x = Math.sin(th) * r, z = Math.cos(th) * r;
      mannequinGrad(x, y, z, g);
      vp.push(x, y, z); vn.push(g[0], g[1], g[2]); vuvArr.push(ix / SLICES, iy / STACKS); vao.push(1);
    }
  }
  for (let iy = 0; iy < STACKS; iy++) {
    for (let ix = 0; ix < SLICES; ix++) {
      const a = iy * (SLICES + 1) + ix, b = a + 1, c = a + SLICES + 1, d2 = c + 1;
      idx.push(a, c, b, b, c, d2);
    }
  }
  extraMeshes.push({
    name: 'mannequin', material: 'mann',
    pos: Float32Array.from(vp), nrm: Float32Array.from(vn),
    uv: Float32Array.from(vuvArr), ao: Float32Array.from(vao), idx: Uint32Array.from(idx),
  });
}

// ---------------------------------------------------------------- export
function subMesh(name, material, ids) {
  // gather referenced verts -> local indexing
  const map = new Map();
  const lpos = [], lnrm = [], luv = [], lao = [];
  const lidx = new Uint32Array(ids.length);
  for (let k = 0; k < ids.length; k++) {
    const g = ids[k];
    let li = map.get(g);
    if (li === undefined) {
      li = map.size; map.set(g, li);
      lpos.push(pos[g * 3], pos[g * 3 + 1], pos[g * 3 + 2]);
      lnrm.push(normals[g * 3], normals[g * 3 + 1], normals[g * 3 + 2]);
      luv.push(uv[g * 2], uv[g * 2 + 1]);
      lao.push(ao[g]);
    }
    lidx[k] = li;
  }
  return {
    name, material,
    pos: Float32Array.from(lpos), nrm: Float32Array.from(lnrm),
    uv: Float32Array.from(luv), ao: Float32Array.from(lao), idx: lidx,
  };
}

const meshes = [
  subMesh('body', 'fabric', [...triFront, ...triBack]),
  subMesh('sleeveL', 'fabric', triSL),
  subMesh('sleeveR', 'fabric', triSR),
  subMesh('collar', 'collar', triCollar),
  ...extraMeshes,
];

// binary layout
let binSize = 0;
const manifest = { version: 2, atlas: ATLAS, meshes: [] };
for (const m of meshes) {
  const entry = {
    name: m.name, material: m.material,
    v: m.pos.length / 3, i: m.idx.length, offset: binSize,
  };
  binSize += m.pos.byteLength + m.nrm.byteLength + m.uv.byteLength + m.ao.byteLength + m.idx.byteLength;
  manifest.meshes.push(entry);
}
const jsonBuf = Buffer.from(JSON.stringify(manifest));
const jsonPad = (4 - (jsonBuf.length % 4)) % 4;
const total = 12 + jsonBuf.length + jsonPad + binSize;
const out = Buffer.alloc(total);
out.write('SHRT', 0);
out.writeUInt32LE(2, 4);
out.writeUInt32LE(jsonBuf.length + jsonPad, 8);
jsonBuf.copy(out, 12);
let off = 12 + jsonBuf.length + jsonPad;
for (const m of meshes) {
  for (const arr of [m.pos, m.nrm, m.uv, m.ao, m.idx]) {
    Buffer.from(arr.buffer, arr.byteOffset, arr.byteLength).copy(out, off);
    off += arr.byteLength;
  }
}
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, out);
console.log(`wrote ${OUT} (${(total / 1024).toFixed(0)} KB), meshes:`, manifest.meshes.map((m) => `${m.name}:${m.v}v`).join(' '));
