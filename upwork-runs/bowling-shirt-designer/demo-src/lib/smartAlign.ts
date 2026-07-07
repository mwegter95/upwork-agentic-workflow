/**
 * Smart-align: detect the image subject's bounding box.
 *
 * Tier 1 (always-on, <10ms): alpha/variance content-bbox scan.
 * Tier 2 (optional, first-call ~12-60 MB download): @imgly/background-removal WASM
 *   (WebGPU-accelerated when navigator.gpu exists). Degrades to Tier 1 on failure.
 */

import type { ImageTransform } from './store';

export interface SubjectBox {
  centerX: number;
  centerY: number;
  scaleHint: number;
}

/** Tier 1: fast deterministic scan */
export function contentBbox(img: HTMLImageElement): SubjectBox {
  const W = Math.min(img.naturalWidth, 512);
  const H = Math.min(img.naturalHeight, 512);
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d')!;
  ctx.drawImage(img, 0, 0, W, H);
  const data = ctx.getImageData(0, 0, W, H).data;

  let minX = W, minY = H, maxX = 0, maxY = 0;
  let hasAlpha = false;
  for (let i = 3; i < data.length; i += 4) { if (data[i] < 250) { hasAlpha = true; break; } }

  if (hasAlpha) {
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (data[(y * W + x) * 4 + 3] > 20) {
        if (x < minX) minX = x; if (x > maxX) maxX = x;
        if (y < minY) minY = y; if (y > maxY) maxY = y;
      }
    }
  } else {
    const blockSize = 16;
    const bW = Math.ceil(W / blockSize);
    const bH = Math.ceil(H / blockSize);
    const lumens: number[] = [];
    for (let by = 0; by < bH; by++) for (let bx = 0; bx < bW; bx++) {
      let sum = 0, count = 0;
      for (let dy = 0; dy < blockSize && by * blockSize + dy < H; dy++)
        for (let dx = 0; dx < blockSize && bx * blockSize + dx < W; dx++) {
          const i = ((by * blockSize + dy) * W + (bx * blockSize + dx)) * 4;
          sum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          count++;
        }
      lumens.push(sum / count);
    }
    const sorted = [...lumens].sort((a, b) => a - b);
    const lo = sorted[Math.floor(sorted.length * 0.1)];
    const hi = sorted[Math.floor(sorted.length * 0.9)];
    const thresh = lo + (hi - lo) * 0.3;
    for (let by = 0; by < bH; by++) for (let bx = 0; bx < bW; bx++) {
      if (lumens[by * bW + bx] > thresh) {
        const px = bx * blockSize, py = by * blockSize;
        if (px < minX) minX = px; if (px > maxX) maxX = px;
        if (py < minY) minY = py; if (py > maxY) maxY = py;
      }
    }
    if (minX >= maxX) { minX = 0; minY = 0; maxX = W; maxY = H; }
  }

  const cxRel = ((minX + maxX) / 2) / W;
  const cyRel = ((minY + maxY) / 2) / H;
  const fillW = (maxX - minX) / W;
  const fillH = (maxY - minY) / H;
  const scaleHint = 1 / Math.max(fillW, fillH, 0.1);

  return { centerX: cxRel, centerY: cyRel, scaleHint };
}

// @imgly/background-removal loaded from the jsDelivr ESM CDN at runtime so the
// heavy onnxruntime-web WASM never enters the webpack/SWC build. The `+esm`
// endpoint rewrites bare specifiers to CDN URLs, so it runs natively in-browser.
const IMGLY_CDN = 'https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.7.0/+esm';

/** Tier 2: @imgly WebGPU/WASM refine (lazy, CDN, degrades gracefully) */
export async function imglyRefine(img: HTMLImageElement): Promise<SubjectBox> {
  try {
    const mod: any = await import(/* webpackIgnore: true */ IMGLY_CDN);
    const removeBackground = mod.removeBackground;
    const blob = await removeBackground(img.src, {
      output: { format: 'image/png', quality: 0.8 },
    });
    const url = URL.createObjectURL(blob);
    const cutout = new Image();
    await new Promise<void>((res, rej) => {
      cutout.onload = () => res();
      cutout.onerror = rej;
      cutout.src = url;
    });
    const box = contentBbox(cutout);
    URL.revokeObjectURL(url);
    return box;
  } catch {
    return contentBbox(img);
  }
}

/** WebGPU availability probe (drives the smart-align label/UX). */
export function hasWebGPU(): boolean {
  return typeof navigator !== 'undefined' && 'gpu' in navigator;
}

/**
 * Convert a SubjectBox to an ImageTransform that centers + fills the subject.
 */
export function boxToTransform(box: SubjectBox): ImageTransform {
  return {
    scale: Math.min(box.scaleHint, 4),
    offsetX: 0.5 - box.centerX,
    offsetY: 0.5 - box.centerY,
    rotation: 0,
  };
}
