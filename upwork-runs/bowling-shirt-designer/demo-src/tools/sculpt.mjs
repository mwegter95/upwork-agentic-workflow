#!/usr/bin/env node
/**
 * sculpt.mjs — deterministic garment authoring (no dynamics).
 *
 * Directly places every vertex of a Bowlifi-style mock-neck quarter-zip
 * bowling jersey in its final draped pose:
 *   - body panels wrapped onto an analytic garment loft whose cross-sections
 *     consume exactly the pattern's fabric width (fullness -> drape folds)
 *   - sleeves lofted from the true armhole ring onto tubes around the arm pose
 *   - stand collar extruded from the placed neckline
 *   - crafted displacement fields for wrinkles (hang folds, armpit tension,
 *     zip channel, sleeve compression, hem waves), SDF collision cleanup
 *   - welded seams, seam pinch, hemisphere-raycast AO, trim + zipper geometry
 *
 * Output: public/shirt.bin (same format tools/drape.mjs used).
 * Runs in a few seconds. Usage: node tools/sculpt.mjs [--mann] [--out path]
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = process.argv.includes('--out')
  ? process.argv[process.argv.indexOf('--out') + 1]
  : path.join(__dirname, '..', 'public', 'shirt.bin');

// ---------------------------------------------------------------- utilities
let _seed = 20260707;
function rand() {
  _seed = (_seed * 1664525 + 1013904223) >>> 0;
  return _seed / 4294967296;
}
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const smooth = (a, b, x) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

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

// ---------------------------------------------------------------- mannequin SDF (collision cleanup + proportions)
const TORSO = [
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
const ARM_ANG = (38 * Math.PI) / 180;
const ARM_DIR = [Math.sin(ARM_ANG), -Math.cos(ARM_ANG), 0.10];
(() => { const l = Math.hypot(...ARM_DIR); ARM_DIR[0] /= l; ARM_DIR[1] /= l; ARM_DIR[2] /= l; })();
// deltoid top ~ acromion height, just below the neck base (anatomy, not a coat rack)
const SHOULDER = { x: 0.176, y: 0.370, z: 0.004, r: 0.070 };
const ARM_LEN = 0.36, ARM_R0 = 0.055, ARM_R1 = 0.046;
const NECK = { x: 0, y0: 0.44, y1: 0.66, z0: 0.008, z1: 0.016, r: 0.058 };

function se25(a) { return a * a * Math.sqrt(a); }
function sdTorso(x, y, z) {
  if (y <= TORSO[0][0]) return (TORSO[0][0] - y);
  if (y >= TORSO[TORSO.length - 1][0]) {
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
function sdSphere(x, y, z, cx, cy, cz, r) { return Math.hypot(x - cx, y - cy, z - cz) - r; }
function sdCapsule(x, y, z, ax, ay, az, bx, by, bz, r0, r1) {
  const abx = bx - ax, aby = by - ay, abz = bz - az;
  const apx = x - ax, apy = y - ay, apz = z - az;
  const t = clamp((apx * abx + apy * aby + apz * abz) / (abx * abx + aby * aby + abz * abz), 0, 1);
  return Math.hypot(apx - abx * t, apy - aby * t, apz - abz * t) - lerp(r0, r1, t);
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
  d = smin(d, sdCapsule(x, y, z, 0.02, NECK.y0 + 0.01, 0, SHOULDER.x - 0.014, SHOULDER.y + 0.012, SHOULDER.z, 0.058, 0.052), 0.045);
  d = smin(d, sdCapsule(x, y, z, -0.02, NECK.y0 + 0.01, 0, -(SHOULDER.x - 0.014), SHOULDER.y + 0.012, SHOULDER.z, 0.058, 0.052), 0.045);
  const ax = SHOULDER.x + ARM_DIR[0] * 0.02, ay = SHOULDER.y + ARM_DIR[1] * 0.02, az = SHOULDER.z;
  d = smin(d, sdCapsule(x, y, z, ax, ay, az, ax + ARM_DIR[0] * ARM_LEN, ay + ARM_DIR[1] * ARM_LEN, az + ARM_DIR[2] * ARM_LEN, ARM_R0, ARM_R1), 0.02);
  d = smin(d, sdCapsule(x, y, z, -ax, ay, az, -(ax + ARM_DIR[0] * ARM_LEN), ay + ARM_DIR[1] * ARM_LEN, az + ARM_DIR[2] * ARM_LEN, ARM_R0, ARM_R1), 0.02);
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

// ---------------------------------------------------------------- pattern (same cut as before)
const HALF_CHEST = 0.295;
const HEM_HALF = 0.283;
const HEM_Y = -0.34;
const UNDERARM_Y = 0.155;
const SHOULDER_TIP = [0.218, 0.383];
const NECK_HALF = 0.076;
const NECK_Y_SIDE = 0.428;
const FRONT_NECK_Y = 0.392;
const BACK_NECK_Y = 0.418;

const NS = 72, NT = 92;
const SIDE_ROWS = 66;
const ARM_ROWS = NT - SIDE_ROWS;
const SLEEVE_AROUND = ARM_ROWS * 2;
const SLEEVE_ALONG = 26;
const SLEEVE_LEN = 0.24;
const COLLAR_ROWS = 8;
const COLLAR_H = 0.054;
const SHOULDER_COLS = 16;

function topChain(neckCenterY) {
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
  const top = topChain(isFront ? FRONT_NECK_Y : BACK_NECK_Y);
  const left = sideChain(-1);
  const right = sideChain(1);
  const bottom = resample([[-HEM_HALF, HEM_Y], [HEM_HALF, HEM_Y]], NS + 1);
  return { pat: coonsGrid(bottom, top, left, right), W: NS + 1, H: NT + 1 };
}

// ---------------------------------------------------------------- vertex store
const px = [], py = [], pz = [];
const patX = [], patY = [];
const panelOf = [];
function addVert(x, y, z, pu, pv, panel) {
  px.push(x); py.push(y); pz.push(z);
  patX.push(pu); patY.push(pv); panelOf.push(panel);
  return px.length - 1;
}

// ---------------------------------------------------------------- garment loft
// pattern half-width of the body at height y (front == back near enough)
function patternHalfWidth(y) {
  if (y <= UNDERARM_Y) {
    const t = (y - HEM_Y) / (UNDERARM_Y - HEM_Y);
    return lerp(HEM_HALF, HALF_CHEST, smooth(0, 1, t * 0.9 + 0.1));
  }
  // above underarm the wrap only matters up to the armhole; narrow gently
  const t = smooth(UNDERARM_Y, SHOULDER_TIP[1], y);
  return lerp(HALF_CHEST, SHOULDER_TIP[0] + 0.01, t);
}
// depth profile D(y) (side-view silhouette) and forward offset zc(y)
function depthProfile(y) {
  const hemT = smooth(HEM_Y, -0.05, y);
  const chestT = smooth(-0.05, 0.26, y);
  const upT = smooth(0.30, 0.42, y);
  let D = lerp(0.155, 0.163, hemT);
  D = lerp(D, 0.174, chestT);
  D = lerp(D, 0.128, upT);
  const zc = 0.004 + 0.008 * smooth(0.0, 0.26, y) - 0.004 * smooth(0.30, 0.42, y);
  return [D, zc];
}
// superellipse quarter section; returns W solved so the FRONT half arc == arcTarget
const SEC_SAMPLES = 48;
function frontHalfArc(W, D, n) {
  // t 0..pi (from +x side seam over front center to -x side seam)
  let arc = 0;
  let lx = 0, lz = 0;
  for (let i = 0; i <= SEC_SAMPLES; i++) {
    const t = (i / SEC_SAMPLES) * Math.PI;
    const s = Math.sin(t), c = Math.cos(t);
    const x = W * Math.sign(c) * Math.pow(Math.abs(c), 2 / n);
    const z = D * Math.pow(Math.abs(s), 2 / n);
    if (i > 0) arc += Math.hypot(x - lx, z - lz);
    lx = x; lz = z;
  }
  return arc;
}
function solveSectionW(arcTarget, D, n) {
  let lo = arcTarget / Math.PI, hi = arcTarget / 2;
  for (let k = 0; k < 24; k++) {
    const mid = (lo + hi) / 2;
    if (frontHalfArc(mid, D, n) < arcTarget) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}
// place a point at arc-distance s (from front center, signed) on the section
function sectionPoint(W, D, zc, n, sArc, isFront) {
  // walk the quarter arc numerically
  const total = frontHalfArc(W, D, n) / 2; // center to seam
  const target = clamp(Math.abs(sArc), 0, total);
  let acc = 0, lx = 0, lz = D; // t=pi/2 is front center (x=0,z=D)
  let X = 0, Z = D;
  for (let i = 1; i <= SEC_SAMPLES; i++) {
    const t = Math.PI / 2 - (i / SEC_SAMPLES) * (Math.PI / 2); // walk toward +x seam
    const s = Math.sin(t), c = Math.cos(t);
    const x = W * Math.pow(Math.abs(c), 2 / n);
    const z = D * Math.pow(Math.abs(s), 2 / n);
    const seg = Math.hypot(x - lx, z - lz);
    if (acc + seg >= target) {
      const f = (target - acc) / (seg || 1e-9);
      X = lerp(lx, x, f); Z = lerp(lz, z, f);
      acc = target;
      break;
    }
    acc += seg; lx = x; lz = z; X = x; Z = z;
  }
  const sgn = Math.sign(sArc) || 1;
  return [sgn * X, isFront ? Z + zc : -(Z) + zc];
}

const SEC_EXP = 2.35;
function placeBodyPanel(panel, isFront) {
  const { pat, W, H } = panel;
  const ids = new Int32Array(W * H);
  for (let iy = 0; iy < H; iy++) {
    for (let ix = 0; ix < W; ix++) {
      const k = (iy * W + ix) * 2;
      const pxx = pat[k], pyy = pat[k + 1];
      // --- section wrap (below shoulders)
      // fabric fullness: consume slightly less arc than the pattern width; the
      // remainder reads as the displacement folds instead of ballooning
      const arcHalf = patternHalfWidth(pyy) * 0.965;
      const [D, zc] = depthProfile(pyy);
      const Wsec = solveSectionW(arcHalf * 2, D, SEC_EXP);
      const [sx, sz] = sectionPoint(Wsec, D, zc, SEC_EXP, pxx, isFront);
      // --- shoulder wedge (top): fabric lies flat, panels converge at the seam
      const shDepth = lerp(0.10, 0.012, smooth(0.30, NECK_Y_SIDE - 0.006, pyy));
      const wx = pxx * 0.97;
      const wz = (isFront ? 1 : -1) * shDepth + zc + (isFront ? 0.012 : -0.004);
      const blend = smooth(0.28, 0.37, pyy);
      let x = lerp(sx, wx, blend);
      let z = lerp(sz, wz, blend);
      let yy = pyy;
      // yoke shrinkwrap: near the shoulder seam the fabric drapes down onto the
      // trapezius/deltoid slope instead of tenting above it
      if (pyy > 0.32) {
        const slack = 0.005 + 0.022 * (1 - smooth(0.33, 0.42, pyy));
        const d = mannequinSDF(x, yy, z);
        if (d > slack) {
          const g = [0, 0, 0];
          mannequinGrad(x, yy, z, g);
          const move = (d - slack) * smooth(0.32, 0.36, pyy);
          x -= g[0] * move; yy -= g[1] * move; z -= g[2] * move;
        }
      }
      ids[iy * W + ix] = addVert(x, yy, z, pxx, pyy, isFront ? 0 : 1);
    }
  }
  return ids;
}

const front = buildBodyPanel(true);
const back = buildBodyPanel(false);
const fIds = placeBodyPanel(front, true);
const bIds = placeBodyPanel(back, false);

// ---------------------------------------------------------------- sleeves
// armhole ring (positions already placed): front col0 rows SIDE..NT + back reversed
function armholeRing(colF, colB) {
  const ring = [];
  for (let iy = SIDE_ROWS; iy <= NT; iy++) ring.push(fIds[iy * front.W + colF]);
  const backPart = [];
  for (let iy = SIDE_ROWS; iy <= NT; iy++) backPart.push(bIds[iy * back.W + colB]);
  backPart.pop(); // shoulder tip shared
  backPart.reverse();
  return [...ring, ...backPart]; // length SLEEVE_AROUND + 1
}
function placeSleeve(side) {
  const ring = side < 0 ? armholeRing(0, 0) : armholeRing(NS, NS);
  const W = SLEEVE_AROUND + 1, H = SLEEVE_ALONG + 1;
  const ids = new Int32Array(W * H);
  // ring centroid + arm axis
  let cx = 0, cy = 0, cz = 0;
  for (const v of ring) { cx += px[v]; cy += py[v]; cz += pz[v]; }
  cx /= ring.length; cy /= ring.length; cz /= ring.length;
  const dir = [side * ARM_DIR[0], ARM_DIR[1], ARM_DIR[2]];
  // basis around arm
  let u0 = [-dir[1], dir[0], 0];
  { const l = Math.hypot(...u0); u0 = u0.map((v) => v / l); }
  const v0 = [
    dir[1] * u0[2] - dir[2] * u0[1],
    dir[2] * u0[0] - dir[0] * u0[2],
    dir[0] * u0[1] - dir[1] * u0[0],
  ];
  // ring angular signature: angle of each armhole vert around the axis at l=0
  const ringAng = ring.map((v) => {
    const rx = px[v] - cx, ry = py[v] - cy, rz = pz[v] - cz;
    const a = rx * u0[0] + ry * u0[1] + rz * u0[2];
    const b = rx * v0[0] + ry * v0[1] + rz * v0[2];
    return Math.atan2(b, a);
  });
  // per-ring-vertex start radius (distance from centroid), so the loft leaves
  // the true armhole shape and eases into a clean elliptical tube: convex
  // sections all the way down, no folding possible.
  const ringRad = ring.map((v) => {
    const rx = px[v] - cx, ry = py[v] - cy, rz = pz[v] - cz;
    const a = rx * u0[0] + ry * u0[1] + rz * u0[2];
    const b = rx * v0[0] + ry * v0[1] + rz * v0[2];
    return Math.hypot(a, b); // radial component only
  });
  const ringAxial = ring.map((v) => {
    const rx = px[v] - cx, ry = py[v] - cy, rz = pz[v] - cz;
    return rx * dir[0] + ry * dir[1] + rz * dir[2]; // along-arm component
  });
  // arc-length parametrization of the ring: the texture 'around' coordinate must
  // follow real fabric distance, not column index (ring verts bunch near the tip)
  const ringArc = [0];
  for (let k = 1; k < ring.length; k++) {
    const a = ring[k - 1], b = ring[k];
    ringArc.push(ringArc[k - 1] + Math.hypot(px[b] - px[a], py[b] - py[a], pz[b] - pz[a]));
  }
  const ringCirc = ringArc[ringArc.length - 1] +
    Math.hypot(px[ring[0]] - px[ring[ring.length - 1]], py[ring[0]] - py[ring[ring.length - 1]], pz[ring[0]] - pz[ring[ring.length - 1]]);
  const R_HEM = 0.058;
  for (let iy = 0; iy < H; iy++) {
    const t = iy / SLEEVE_ALONG;
    const l = t * SLEEVE_LEN;
    // center line: along arm with a gentle underarm sag toward the hem
    const sag = 0.009 * t * t;
    const ccx = cx + dir[0] * l, ccy = cy + dir[1] * l - sag, ccz = cz + dir[2] * l;
    const morph = smooth(0, 0.55, t); // armhole radii -> tube radius
    for (let ix = 0; ix < W; ix++) {
      const k = ix % ring.length;
      const ang = ringAng[k];
      // radius eases from this vertex's armhole radius to the hem radius
      const rad = lerp(ringRad[k], lerp(0.063, R_HEM, smooth(0.15, 1, t)), morph);
      // shorter underseam: the underside of the sleeve hem pulls back up the
      // arm, so the opening tilts away from the viewer instead of gaping
      const radDirY = u0[1] * Math.cos(ang) + v0[1] * Math.sin(ang);
      const underseam = -0.018 * Math.max(-radDirY, 0) * smooth(0.3, 1, t);
      const axial = ringAxial[k] * (1 - morph) + underseam;
      const x = ccx + (u0[0] * Math.cos(ang) + v0[0] * Math.sin(ang)) * rad + dir[0] * axial;
      const y = ccy + (u0[1] * Math.cos(ang) + v0[1] * Math.sin(ang)) * rad + dir[1] * axial;
      const z = ccz + (u0[2] * Math.cos(ang) + v0[2] * Math.sin(ang)) * rad + dir[2] * axial;
      const pu = (ringArc[k] / ringCirc - 0.5) * (2 * Math.PI * 0.062) * lerp(1, 0.86, t);
      ids[iy * W + ix] = addVert(x, y, z, pu, -l, side < 0 ? 2 : 3);
    }
  }
  return { ids, ring };
}
const SL = placeSleeve(-1);
const SR = placeSleeve(1);
const slIds = SL.ids, srIds = SR.ids;

// ---------------------------------------------------------------- collar
// bottom row = neckline chain (front-center -> left -> back -> right -> front-center)
function neckChain() {
  const frontNeck = [], backNeck = [];
  for (let ix = SHOULDER_COLS; ix <= NS - SHOULDER_COLS; ix++) {
    frontNeck.push(fIds[NT * front.W + ix]);
    backNeck.push(bIds[NT * back.W + ix]);
  }
  const centerF = Math.floor(frontNeck.length / 2);
  return [
    ...frontNeck.slice(0, centerF + 1).reverse(),
    ...backNeck,
    ...frontNeck.slice(centerF).reverse(),
  ];
}
const chain = neckChain();
const COLLAR_W = chain.length;
function placeCollar() {
  // bottom row follows the neckline; upper rows blend to a clean analytic ring
  // around the neck with a level top edge (slightly lower in front) — a crisp
  // interfaced stand collar, immune to neckline waviness.
  const W = COLLAR_W, H = COLLAR_ROWS + 1;
  const ids = new Int32Array(W * H);
  const RX = 0.071, RZ = 0.067; // ring radii (snug around the neck)
  const ZC = NECK.z0 + 0.006;
  for (let iy = 0; iy < H; iy++) {
    const v = iy / COLLAR_ROWS;
    for (let ix = 0; ix < W; ix++) {
      const nv = chain[ix];
      const ang = Math.atan2(px[nv], pz[nv] - ZC);
      const frontness = Math.max(Math.cos(ang), 0);
      // analytic ring point at this angle
      const taper = 1 - 0.06 * v; // tucks inward toward the top
      const rx3 = Math.sin(ang) * RX * taper;
      const rz3 = ZC + Math.cos(ang) * RZ * taper;
      const yTop = NECK.y0 + COLLAR_H - 0.014 * frontness;
      // blend neckline -> ring as the collar rises
      const b = smooth(0, 0.55, v);
      const x = lerp(px[nv], rx3, b);
      const z = lerp(pz[nv], rz3, b);
      const y = lerp(py[nv], yTop, v);
      ids[iy * W + ix] = addVert(x, y, z, ix / (W - 1) * 0.5, v * COLLAR_H, 4);
    }
  }
  return ids;
}
const cIds = placeCollar();

const N = px.length;
const pos = new Float32Array(N * 3);
for (let i = 0; i < N; i++) {
  pos[i * 3] = px[i]; pos[i * 3 + 1] = py[i]; pos[i * 3 + 2] = pz[i];
}

// ---------------------------------------------------------------- weld map (seams)
const sewA = [], sewB = [];
function sew(a, b) { sewA.push(a); sewB.push(b); }
for (let iy = 0; iy <= SIDE_ROWS; iy++) {
  sew(fIds[iy * front.W + 0], bIds[iy * back.W + 0]);
  sew(fIds[iy * front.W + NS], bIds[iy * back.W + NS]);
}
for (let ix = 0; ix <= SHOULDER_COLS; ix++) {
  sew(fIds[NT * front.W + ix], bIds[NT * back.W + ix]);
  sew(fIds[NT * front.W + (NS - ix)], bIds[NT * back.W + (NS - ix)]);
}
for (const { ids, ring } of [SL, SR]) {
  const W = SLEEVE_AROUND + 1;
  for (let ix = 0; ix < W; ix++) sew(ids[ix], ring[ix % ring.length]);
  for (let iy = 0; iy <= SLEEVE_ALONG; iy++) sew(ids[iy * W], ids[iy * W + SLEEVE_AROUND]);
}
for (let ix = 0; ix < COLLAR_W; ix++) sew(cIds[ix], chain[ix]);
const NSEW = sewA.length;

const weldRoot = new Int32Array(N).fill(-1);
function rootOf(i) { let r = i; while (weldRoot[r] >= 0) r = weldRoot[r]; return r; }
for (let s = 0; s < NSEW; s++) {
  const ra = rootOf(sewA[s]), rb = rootOf(sewB[s]);
  if (ra !== rb) weldRoot[Math.max(ra, rb)] = Math.min(ra, rb);
}
function weldPositions() {
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
weldPositions();

// ---------------------------------------------------------------- shoulder/cap relaxation
// Masked Laplacian smoothing + SDF projection: rounds the shoulder-tip horns
// and blends the sleeve cap into the deltoid. Pure smoothing, no dynamics.
{
  const g = [0, 0, 0];
  const OFF = 0.005;
  function relaxGrid(ids, W, H, mask) {
    const tmp = new Float32Array(W * H * 3);
    for (let iy = 0; iy < H; iy++) {
      for (let ix = 0; ix < W; ix++) {
        if (!mask(ix, iy)) continue;
        let ax = 0, ay = 0, az = 0, cnt = 0;
        for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const jx = ix + ox, jy = iy + oy;
          if (jx < 0 || jx >= W || jy < 0 || jy >= H) continue;
          const j = ids[jy * W + jx] * 3;
          ax += pos[j]; ay += pos[j + 1]; az += pos[j + 2]; cnt++;
        }
        const k = (iy * W + ix) * 3;
        tmp[k] = ax / cnt; tmp[k + 1] = ay / cnt; tmp[k + 2] = az / cnt;
      }
    }
    for (let iy = 0; iy < H; iy++) {
      for (let ix = 0; ix < W; ix++) {
        if (!mask(ix, iy)) continue;
        const i = ids[iy * W + ix];
        const k = (iy * W + ix) * 3;
        let x = lerp(pos[i * 3], tmp[k], 0.55);
        let y = lerp(pos[i * 3 + 1], tmp[k + 1], 0.55);
        let z = lerp(pos[i * 3 + 2], tmp[k + 2], 0.55);
        const d = mannequinSDF(x, y, z);
        if (d < OFF) {
          mannequinGrad(x, y, z, g);
          x += g[0] * (OFF - d); y += g[1] * (OFF - d); z += g[2] * (OFF - d);
        }
        pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z;
      }
    }
  }
  const neckStart = SHOULDER_COLS, neckEnd = NS - SHOULDER_COLS;
  const bodyMask = (ids) => (ix, iy) => {
    const i = ids[iy * (NS + 1) + ix];
    if (patY[i] < 0.29) return false;
    if (iy === NT && ix >= neckStart && ix <= neckEnd) return false; // keep neckline crisp
    return true;
  };
  const sleeveMask = (ix, iy) => iy > 0 && iy <= Math.floor(SLEEVE_ALONG * 0.45);
  for (let it = 0; it < 10; it++) {
    relaxGrid(fIds, front.W, front.H, bodyMask(fIds));
    relaxGrid(bIds, back.W, back.H, bodyMask(bIds));
    relaxGrid(slIds, SLEEVE_AROUND + 1, SLEEVE_ALONG + 1, sleeveMask);
    relaxGrid(srIds, SLEEVE_AROUND + 1, SLEEVE_ALONG + 1, sleeveMask);
    weldPositions();
  }
}

// ---------------------------------------------------------------- triangles + normals
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
function flipTris(tris) {
  for (let t = 0; t < tris.length; t += 3) { const tmp = tris[t + 1]; tris[t + 1] = tris[t + 2]; tris[t + 2] = tmp; }
}
function faceNormalSign(ids, W, H, expect) {
  const iy = Math.floor(H / 2), ix = Math.floor(W / 2);
  const a = ids[iy * W + ix] * 3, b = ids[iy * W + ix + 1] * 3, c = ids[(iy + 1) * W + ix] * 3;
  const abx = pos[b] - pos[a], aby = pos[b + 1] - pos[a + 1], abz = pos[b + 2] - pos[a + 2];
  const acx = pos[c] - pos[a], acy = pos[c + 1] - pos[a + 1], acz = pos[c + 2] - pos[a + 2];
  const nx = aby * acz - abz * acy, ny = abz * acx - abx * acz, nz = abx * acy - aby * acx;
  return nx * expect[0] + ny * expect[1] + nz * expect[2];
}
if (faceNormalSign(fIds, front.W, front.H, [0, 0, 1]) < 0) flipTris(triFront);
if (faceNormalSign(bIds, back.W, back.H, [0, 0, -1]) < 0) flipTris(triBack);
// sleeves: outward from arm axis at the outer side
for (const [S, tris, side] of [[SL, triSL, -1], [SR, triSR, 1]]) {
  if (faceNormalSign(S.ids, SLEEVE_AROUND + 1, SLEEVE_ALONG + 1, [side, 0.3, 0]) < 0) flipTris(tris);
}
{
  const mid = Math.floor(COLLAR_W / 2); // back of collar: outward = -z
  const iy = Math.floor(COLLAR_ROWS / 2);
  const a = cIds[iy * COLLAR_W + mid] * 3, b = cIds[iy * COLLAR_W + mid + 1] * 3, c = cIds[(iy + 1) * COLLAR_W + mid] * 3;
  const abx = pos[b] - pos[a], aby = pos[b + 1] - pos[a + 1], abz = pos[b + 2] - pos[a + 2];
  const acx = pos[c] - pos[a], acy = pos[c + 1] - pos[a + 1], acz = pos[c + 2] - pos[a + 2];
  const nz = abx * acy - aby * acx;
  if (nz > 0) flipTris(triCollar);
}
const allTris = [...triFront, ...triBack, ...triSL, ...triSR, ...triCollar];

function computeNormals() {
  const nrm = new Float32Array(N * 3);
  for (let t = 0; t < allTris.length; t += 3) {
    const a = allTris[t] * 3, b = allTris[t + 1] * 3, c = allTris[t + 2] * 3;
    const abx = pos[b] - pos[a], aby = pos[b + 1] - pos[a + 1], abz = pos[b + 2] - pos[a + 2];
    const acx = pos[c] - pos[a], acy = pos[c + 1] - pos[a + 1], acz = pos[c + 2] - pos[a + 2];
    const nx = aby * acz - abz * acy, ny = abz * acx - abx * acz, nz = abx * acy - aby * acx;
    for (const v of [allTris[t], allTris[t + 1], allTris[t + 2]]) {
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
let normals = computeNormals();

// ---------------------------------------------------------------- wrinkle displacement
// crafted fields in pattern space, applied along normals, then collision cleanup.
const disp = new Float32Array(N);
function ridge(d, width) { // soft ridge profile
  const t = clamp(Math.abs(d) / width, 0, 1);
  return (1 - t * t) * (1 - t * t);
}
// per-panel fields
{
  // organic multi-wave phases
  const hangPhases = [rand() * 6.28, rand() * 6.28, rand() * 6.28];
  const hangAmps = [0.010, 0.007, 0.005];
  const hangFreqs = [5.2, 8.6, 12.9];
  for (let i = 0; i < N; i++) {
    const p = panelOf[i];
    const u = patX[i], v = patY[i];
    let d = 0;
    if (p === 0 || p === 1) {
      const mirror = p === 1 ? -1 : 1;
      // 1) vertical hang folds: grow from chest to hem
      const hang = smooth(0.24, -0.34, v) * 0.55 + 0.45 * smooth(0.05, -0.34, v);
      for (let k = 0; k < 3; k++) {
        d += Math.sin(u * hangFreqs[k] * mirror + hangPhases[k] + (p === 1 ? 2.1 : 0)) * hangAmps[k] * hang;
      }
      // 2) armpit tension folds -> radiate toward center chest/back
      for (const s of [-1, 1]) {
        const dx = u - s * HALF_CHEST, dy = v - UNDERARM_Y;
        const dist = Math.hypot(dx, dy);
        const ang = Math.atan2(dy, dx);
        d += Math.sin(ang * 3.0 + s * 1.2) * 0.005 * ridge(dist - 0.10, 0.10) * smooth(0.24, 0.05, Math.abs(dist - 0.10));
      }
      // 3) zip channel (front only): shallow groove flanked by soft welts
      if (p === 0) {
        const zipT = smooth(0.10, 0.34, v);
        d -= 0.0035 * ridge(u, 0.012) * zipT;
        d += 0.0022 * (ridge(Math.abs(u) - 0.028, 0.016)) * zipT;
        // chest smoothing: fabric tensioned over the chest
        d *= 1 - 0.35 * smooth(0.10, 0.30, v);
      }
      // 4) shoulder-blade drape (back only): two soft vertical folds
      if (p === 1) {
        for (const s of [-1, 1]) {
          d += 0.0035 * ridge(u - s * 0.13, 0.05) * smooth(0.30, -0.05, v) * smooth(-0.34, -0.1, v);
        }
      }
      // 5) hem micro waves
      d += Math.sin(u * 30 + (p === 1 ? 1 : 0)) * 0.0016 * smooth(-0.24, -0.34, v);
    } else if (p === 2 || p === 3) {
      // sleeves: u = around (0 underarm-ish), v = -l along
      const l = -v;
      const around = u;
      // compression rings near the cap and mid-sleeve, fading to the hem
      d += Math.sin(l * 90 + around * 14) * 0.0022 * smooth(0.02, 0.10, l) * smooth(0.22, 0.12, l);
      // underarm slack folds
      d += Math.sin(around * 26) * 0.0035 * smooth(0.03, 0.13, l) * smooth(0.24, 0.10, l);
      // top-of-sleeve tension: flatten
      d *= 1 - 0.4 * ridge(Math.abs(around) - 0.11, 0.06);
      // hem flutter
      d += Math.sin(around * 40 + 2) * 0.0014 * smooth(0.16, 0.24, l);
    }
    // collar: crisp, no wrinkles
    disp[i] = d;
  }
}
// smooth the displacement field a touch (two Jacobi passes over grid neighbors)
function smoothField(ids, W, H) {
  const tmp = new Float32Array(W * H);
  for (let pass = 0; pass < 2; pass++) {
    for (let iy = 0; iy < H; iy++) {
      for (let ix = 0; ix < W; ix++) {
        let acc = 0, cnt = 0;
        for (const [ox, oy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const jx = ix + ox, jy = iy + oy;
          if (jx < 0 || jx >= W || jy < 0 || jy >= H) continue;
          acc += disp[ids[jy * W + jx]]; cnt++;
        }
        tmp[iy * W + ix] = acc / cnt;
      }
    }
    for (let k = 0; k < W * H; k++) disp[ids[k]] = tmp[k];
  }
}
smoothField(fIds, front.W, front.H);
smoothField(bIds, back.W, back.H);
smoothField(slIds, SLEEVE_AROUND + 1, SLEEVE_ALONG + 1);
smoothField(srIds, SLEEVE_AROUND + 1, SLEEVE_ALONG + 1);
// apply along normals
for (let i = 0; i < N; i++) {
  pos[i * 3] += normals[i * 3] * disp[i];
  pos[i * 3 + 1] += normals[i * 3 + 1] * disp[i];
  pos[i * 3 + 2] += normals[i * 3 + 2] * disp[i];
}
weldPositions();
// collision cleanup: keep fabric off the form
{
  const g = [0, 0, 0];
  const OFF = 0.005;
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < N; i++) {
      const d = mannequinSDF(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]);
      if (d < OFF) {
        mannequinGrad(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2], g);
        const push = OFF - d;
        pos[i * 3] += g[0] * push; pos[i * 3 + 1] += g[1] * push; pos[i * 3 + 2] += g[2] * push;
      }
    }
    weldPositions();
  }
}
normals = computeNormals();

// seam pinch (reads as stitching)
for (let s = 0; s < NSEW; s++) {
  for (const v of [sewA[s], sewB[s]]) {
    const i3 = v * 3;
    pos[i3] -= normals[i3] * 0.0015;
    pos[i3 + 1] -= normals[i3 + 1] * 0.0015;
    pos[i3 + 2] -= normals[i3 + 2] * 0.0015;
  }
}
normals = computeNormals();

// ---------------------------------------------------------------- UVs (atlas v2, matches lib/compositor.ts)
const ATLAS = 2048;
const PXM = 1700;
const ISL = {
  front: { x: 20, y: 460, w: 986, h: 1309 },
  back: { x: 1042, y: 460, w: 986, h: 1309 },
  sleeveL: { x: 24, y: 24, w: 748, h: 400 },
  sleeveR: { x: 800, y: 24, w: 748, h: 400 },
};
const uv = new Float32Array(N * 2);
function assignUV(ids, count, isl, flipX) {
  let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
  for (let k = 0; k < count; k++) {
    const i = ids[k];
    minX = Math.min(minX, patX[i]); maxX = Math.max(maxX, patX[i]);
    minY = Math.min(minY, patY[i]); maxY = Math.max(maxY, patY[i]);
  }
  // scale-to-fit if the pattern is larger than the island (guards against bleed)
  const fit = Math.min(1, isl.w / ((maxX - minX) * PXM), isl.h / ((maxY - minY) * PXM));
  const cw = (maxX - minX) * PXM * fit, ch = (maxY - minY) * PXM * fit;
  const ox = isl.x + (isl.w - cw) / 2, oy = isl.y + (isl.h - ch) / 2;
  for (let k = 0; k < count; k++) {
    const i = ids[k];
    const lx = flipX ? (maxX - patX[i]) : (patX[i] - minX);
    const ly = maxY - patY[i];
    uv[i * 2] = (ox + lx * PXM * fit) / ATLAS;
    uv[i * 2 + 1] = 1 - (oy + ly * PXM * fit) / ATLAS;
  }
}
assignUV(fIds, front.W * front.H, ISL.front, false);
assignUV(bIds, back.W * back.H, ISL.back, true);
assignUV(slIds, (SLEEVE_AROUND + 1) * (SLEEVE_ALONG + 1), ISL.sleeveL, false);
assignUV(srIds, (SLEEVE_AROUND + 1) * (SLEEVE_ALONG + 1), ISL.sleeveR, true);
for (let iy = 0; iy <= COLLAR_ROWS; iy++) {
  for (let ix = 0; ix < COLLAR_W; ix++) {
    const i = cIds[iy * COLLAR_W + ix];
    uv[i * 2] = ix / (COLLAR_W - 1);
    uv[i * 2 + 1] = iy / COLLAR_ROWS;
  }
}

// ---------------------------------------------------------------- AO bake
console.time('ao');
const triCount = allTris.length / 3;
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
  const a = allTris[t * 3] * 3, b = allTris[t * 3 + 1] * 3, c = allTris[t * 3 + 2] * 3;
  const g0 = [0, 1, 2].map((k) => clamp(Math.floor(((Math.min(pos[a + k], pos[b + k], pos[c + k]) - bbMin[k]) / (bbMax[k] - bbMin[k] + 1e-9)) * GRID), 0, GRID - 1));
  const g1 = [0, 1, 2].map((k) => clamp(Math.floor(((Math.max(pos[a + k], pos[b + k], pos[c + k]) - bbMin[k]) / (bbMax[k] - bbMin[k] + 1e-9)) * GRID), 0, GRID - 1));
  for (let gx = g0[0]; gx <= g1[0]; gx++)
    for (let gy = g0[1]; gy <= g1[1]; gy++)
      for (let gz = g0[2]; gz <= g1[2]; gz++) {
        const key = (gx * GRID + gy) * GRID + gz;
        (cells[key] ||= []).push(t);
      }
}
function rayTri(ox, oy, oz, dx, dy, dz, t) {
  const a = allTris[t * 3] * 3, b = allTris[t * 3 + 1] * 3, c = allTris[t * 3 + 2] * 3;
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
function occluded(ox, oy, oz, dx, dy, dz, seen) {
  let t = 0;
  const stepLen = Math.min(bbMax[0] - bbMin[0], bbMax[1] - bbMin[1], bbMax[2] - bbMin[2]) / GRID * 0.9;
  seen.clear();
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
  const phi = i * 2.399963;
  const r2 = (i + 0.5) / AO_RAYS;
  const rr = Math.sqrt(r2);
  aoDirs.push([rr * Math.cos(phi), rr * Math.sin(phi), Math.sqrt(1 - r2)]);
}
const ao = new Float32Array(N).fill(1);
{
  const seen = new Set();
  for (let i = 0; i < N; i++) {
    const i3 = i * 3;
    const nx = normals[i3], ny = normals[i3 + 1], nz = normals[i3 + 2];
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
      occ += occluded(ox, oy, oz, dx, dy, dz, seen);
    }
    ao[i] = clamp(1 - (occ / AO_RAYS) * 0.85, 0.25, 1);
  }
}
for (let s = 0; s < NSEW; s++) { ao[sewA[s]] *= 0.93; ao[sewB[s]] *= 0.93; }
console.timeEnd('ao');

// ---------------------------------------------------------------- trim geometry
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
function ringStrip(ids, W, row, name, material, halfW) {
  const centers = [], nrms = [];
  for (let ix = 0; ix < W; ix++) {
    const i = ids[row * W + ix];
    centers.push([pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]]);
    nrms.push([normals[i * 3], normals[i * 3 + 1], normals[i * 3 + 2]]);
  }
  stripMesh(name, material, centers, nrms, halfW, 0.0018);
}
ringStrip(slIds, SLEEVE_AROUND + 1, SLEEVE_ALONG, 'cuffL', 'cuff', 0.011);
ringStrip(srIds, SLEEVE_AROUND + 1, SLEEVE_ALONG, 'cuffR', 'cuff', 0.011);
{
  const centers = [], nrms = [];
  for (let ix = 0; ix <= NS; ix++) {
    const i = fIds[ix];
    centers.push([pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]]);
    nrms.push([normals[i * 3], normals[i * 3 + 1], normals[i * 3 + 2]]);
  }
  for (let ix = NS; ix >= 0; ix--) {
    const i = bIds[ix];
    centers.push([pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]]);
    nrms.push([normals[i * 3], normals[i * 3 + 1], normals[i * 3 + 2]]);
  }
  centers.push(centers[0]); nrms.push(nrms[0]);
  stripMesh('hem', 'cuff', centers, nrms, 0.010, 0.0016);
}

// zipper: collar front edge midline + body center front
{
  const line = [], lineN = [];
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
  stripMesh('zipTape', 'tape', line, lineN, 0.0105, 0.0022);
  const vp = [], vn = [], vuvArr = [], vao = [], idx = [];
  let vc = 0;
  function box(cx, cy, cz, n, t, w, h, dpt) {
    let sx = t[1] * n[2] - t[2] * n[1], sy = t[2] * n[0] - t[0] * n[2], sz = t[0] * n[1] - t[1] * n[0];
    const sl = Math.hypot(sx, sy, sz) || 1; sx /= sl; sy /= sl; sz /= sl;
    const corners = [];
    for (const [a, b, c] of [[-1, -1, 0], [1, -1, 0], [1, 1, 0], [-1, 1, 0], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]]) {
      corners.push([
        cx + sx * a * w / 2 + t[0] * b * h / 2 + n[0] * (c * dpt + 0.0018),
        cy + sy * a * w / 2 + t[1] * b * h / 2 + n[1] * (c * dpt + 0.0018),
        cz + sz * a * w / 2 + t[2] * b * h / 2 + n[2] * (c * dpt + 0.0018),
      ]);
    }
    const faces = [[4, 5, 6, 7], [1, 0, 3, 2], [0, 4, 7, 3], [5, 1, 2, 6], [7, 6, 2, 3], [0, 1, 5, 4]];
    for (const f of faces) {
      const base = vc;
      for (const ci of f) { vp.push(...corners[ci]); vn.push(n[0], n[1], n[2]); vuvArr.push(0, 0); vao.push(1); vc++; }
      idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
    }
  }
  let acc = 0;
  for (let i = 1; i < line.length; i++) {
    const a = line[i - 1], b = line[i];
    const seg = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
    const t = [b[0] - a[0], b[1] - a[1], b[2] - a[2]].map((v) => v / (seg || 1));
    acc += seg;
    while (acc > 0.0034) {
      acc -= 0.0034;
      const f = 1 - acc / seg;
      box(lerp(a[0], b[0], f), lerp(a[1], b[1], f), lerp(a[2], b[2], f), lineN[i], t, 0.0042, 0.0026, 0.0016);
    }
  }
  const sIdx = Math.floor(line.length * 0.34);
  box(line[sIdx][0], line[sIdx][1], line[sIdx][2], lineN[sIdx], [0, -1, 0], 0.011, 0.016, 0.005);
  box(line[sIdx][0], line[sIdx][1] - 0.017, line[sIdx][2] + 0.002, lineN[sIdx], [0, -1, 0], 0.008, 0.022, 0.002);
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
      let r = 0.005;
      for (let k = 0; k < 40; k++) {
        const d = mannequinSDF(Math.sin(th) * r, y, Math.cos(th) * r);
        if (d < 0.0015) break;
        r += d * 0.9;
        if (r > 0.6) break;
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
  const map = new Map();
  const lpos = [], lnrm = [], luv = [], lao = [];
  const lidx = new Uint32Array(ids.length);
  for (let k = 0; k < ids.length; k++) {
    const gg = ids[k];
    let li = map.get(gg);
    if (li === undefined) {
      li = map.size; map.set(gg, li);
      lpos.push(pos[gg * 3], pos[gg * 3 + 1], pos[gg * 3 + 2]);
      lnrm.push(normals[gg * 3], normals[gg * 3 + 1], normals[gg * 3 + 2]);
      luv.push(uv[gg * 2], uv[gg * 2 + 1]);
      lao.push(ao[gg]);
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
let binSize = 0;
const manifest = { version: 3, atlas: ATLAS, meshes: [] };
for (const m of meshes) {
  manifest.meshes.push({ name: m.name, material: m.material, v: m.pos.length / 3, i: m.idx.length, offset: binSize });
  binSize += m.pos.byteLength + m.nrm.byteLength + m.uv.byteLength + m.ao.byteLength + m.idx.byteLength;
}
const jsonBuf = Buffer.from(JSON.stringify(manifest));
const jsonPad = (4 - (jsonBuf.length % 4)) % 4;
const total = 12 + jsonBuf.length + jsonPad + binSize;
const out = Buffer.alloc(total);
out.write('SHRT', 0);
out.writeUInt32LE(3, 4);
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
console.log(`wrote ${OUT} (${(total / 1024).toFixed(0)} KB)`, manifest.meshes.map((m) => `${m.name}:${m.v}v`).join(' '));
