/**
 * 2048x2048 CanvasTexture compositor — panel-atlas layout v2.
 *
 * The draped garment mesh (public/shirt.bin, built by tools/drape.mjs) uses
 * true cut-panel UV islands at uniform texel density (1700 px/m):
 *
 *   FRONT  body panel: x 20..1006,  y 460..1769   (as seen from the front)
 *   BACK   body panel: x 1042..2028, y 460..1769  (as seen from behind — upright, unmirrored)
 *   SLEEVE L: x 24..772,  y 24..424   (unrolled tube: x around arm, y down the sleeve)
 *   SLEEVE R: x 800..1548, y 24..424
 *
 * Because the back island is drawn as-seen, logos/text/images composited into
 * it read correctly on the garment. Front/back meet at the side seams; like a
 * real sewn jersey, all-over art is panel-printed (no fake cylinder wrap).
 */

import * as THREE from 'three';
import type { ImageTransform } from './store';

const W = 2048;
export const ISLANDS = {
  front: { x: 20, y: 460, w: 986, h: 1309 },
  back: { x: 1042, y: 460, w: 986, h: 1309 },
  sleeveL: { x: 24, y: 24, w: 748, h: 400 },
  sleeveR: { x: 800, y: 24, w: 748, h: 400 },
} as const;
// combined band across both body islands (wrap mode dest)
const BAND = { x: ISLANDS.front.x, y: ISLANDS.front.y, w: ISLANDS.back.x + ISLANDS.back.w - ISLANDS.front.x, h: ISLANDS.front.h };

let _canvas: HTMLCanvasElement | null = null;
let _ctx: CanvasRenderingContext2D | null = null;
let _texture: THREE.CanvasTexture | null = null;

export function getCompositorTexture(): THREE.CanvasTexture {
  if (!_texture) {
    _canvas = document.createElement('canvas');
    _canvas.width = _canvas.height = W;
    _ctx = _canvas.getContext('2d')!;
    _texture = new THREE.CanvasTexture(_canvas);
    _texture.wrapS = _texture.wrapT = THREE.ClampToEdgeWrapping;
    _texture.colorSpace = THREE.SRGBColorSpace;
    _texture.anisotropy = 8;
  }
  return _texture;
}

let _rafId: number | null = null;
let _dirty = false;
let _lastParams: CompositeParams | null = null;

export interface CompositeParams {
  baseColor: string;
  pattern?: THREE.CanvasTexture | null;
  frontImage: HTMLImageElement | null;
  backImage: HTMLImageElement | null;
  frontTransform: ImageTransform;
  backTransform: ImageTransform;
  uploadMode: 'wrap' | 'frontback';
  mirrorSeam: boolean;
  backText?: string;
  textColor?: string;
  fontSize?: number;
  fontFamily?: string;
}

export function scheduleRecompose(params: CompositeParams) {
  _lastParams = params;
  _dirty = true;
  if (_rafId === null) {
    _rafId = requestAnimationFrame(() => {
      _rafId = null;
      if (_dirty && _lastParams) {
        recompose(_lastParams);
        _dirty = false;
      }
    });
  }
}

/** draw img into dest rect (cover-fit) honoring the user transform, clipped to clip rect */
function applyTransform(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  destX: number, destY: number, destW: number, destH: number,
  t: ImageTransform,
  clip?: { x: number; y: number; w: number; h: number }
) {
  ctx.save();
  ctx.beginPath();
  const c = clip ?? { x: destX, y: destY, w: destW, h: destH };
  ctx.rect(c.x, c.y, c.w, c.h);
  ctx.clip();

  const cx = destX + destW / 2 + t.offsetX * destW;
  const cy = destY + destH / 2 + t.offsetY * destH;
  ctx.translate(cx, cy);
  ctx.rotate((t.rotation * Math.PI) / 180);
  ctx.scale(t.scale, t.scale);

  const aspect = img.naturalWidth / img.naturalHeight;
  const destAspect = destW / destH;
  let dw: number, dh: number;
  if (aspect > destAspect) {
    dh = destH; dw = dh * aspect;
  } else {
    dw = destW; dh = dw / aspect;
  }
  ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
  ctx.restore();
}

function recompose(p: CompositeParams) {
  if (!_canvas || !_ctx || !_texture) return;
  const ctx = _ctx;

  // 1. Base color fill
  ctx.fillStyle = p.baseColor;
  ctx.fillRect(0, 0, W, W);

  // 2. Pattern layer (tiled, if no image override)
  if (p.pattern && !p.frontImage && !p.backImage) {
    const pCanvas = (p.pattern as any).image as HTMLCanvasElement;
    if (pCanvas) {
      const pat = ctx.createPattern(pCanvas, 'repeat');
      if (pat) {
        ctx.fillStyle = pat;
        ctx.fillRect(0, 0, W, W);
      }
    }
  }

  // 3. Image layers
  if (p.uploadMode === 'wrap') {
    const img = p.frontImage;
    if (img) {
      // art spans both body panels: front shows the left half, back the right
      applyTransform(ctx, img, BAND.x, BAND.y, BAND.w, BAND.h, p.frontTransform);
      if (p.mirrorSeam) {
        // redraw the back island mirrored so both side seams match
        ctx.save();
        ctx.translate(ISLANDS.back.x * 2 + ISLANDS.back.w, 0);
        ctx.scale(-1, 1);
        applyTransform(ctx, img, BAND.x, BAND.y, BAND.w, BAND.h, p.frontTransform,
          { x: ISLANDS.back.x, y: ISLANDS.back.y, w: ISLANDS.back.w, h: ISLANDS.back.h });
        ctx.restore();
      }
      // sleeves continue the art from just above the band's top corners
      for (const [isl, edgeX] of [
        [ISLANDS.sleeveL, BAND.x] as const,
        [ISLANDS.sleeveR, BAND.x + BAND.w - ISLANDS.sleeveR.w] as const,
      ]) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(isl.x, isl.y, isl.w, isl.h);
        ctx.clip();
        // virtual window: the sleeve looks at the band region near its shoulder
        ctx.translate(isl.x - edgeX, isl.y - (BAND.y - isl.h * 0.2));
        applyTransform(ctx, img, BAND.x, BAND.y, BAND.w, BAND.h, p.frontTransform,
          { x: edgeX, y: BAND.y - isl.h, w: isl.w, h: isl.h * 2 });
        ctx.restore();
      }
    }
  } else {
    if (p.frontImage) {
      const f = ISLANDS.front;
      applyTransform(ctx, p.frontImage, f.x, f.y, f.w, f.h, p.frontTransform);
    }
    const backImg = p.backImage ?? p.frontImage;
    if (backImg) {
      const b = ISLANDS.back;
      applyTransform(ctx, backImg, b.x, b.y, b.w, b.h, p.backTransform);
    }
  }

  // 4. Back text (arched team lettering across the shoulder blades)
  if (p.backText) {
    const b = ISLANDS.back;
    ctx.save();
    ctx.beginPath();
    ctx.rect(b.x, b.y, b.w, b.h);
    ctx.clip();
    const size = (p.fontSize ?? 64) * 2.4;
    ctx.font = `bold ${size}px ${p.fontFamily ?? 'Impact'}, Impact, sans-serif`;
    ctx.fillStyle = p.textColor ?? '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const text = p.backText.toUpperCase();
    const cx = b.x + b.w / 2;
    const cy = b.y + b.h * 0.22;
    // gentle arch
    const chars = text.split('');
    const totalW = Math.min(ctx.measureText(text).width, b.w * 0.82);
    const perChar = totalW / Math.max(chars.length, 1);
    let x = cx - totalW / 2 + perChar / 2;
    for (const ch of chars) {
      const rel = (x - cx) / (b.w / 2);
      const yOff = rel * rel * b.h * 0.045;
      const rot = rel * 0.14;
      ctx.save();
      ctx.translate(x, cy + yOff);
      ctx.rotate(rot);
      ctx.fillText(ch, 0, 0);
      ctx.restore();
      x += perChar;
    }
    ctx.restore();
  }

  _texture.needsUpdate = true;
}
