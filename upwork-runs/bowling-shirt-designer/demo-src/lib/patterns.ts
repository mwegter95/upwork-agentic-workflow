import * as THREE from 'three';
import type { PatternKey } from './store';

function makeTexture(draw: (ctx: CanvasRenderingContext2D) => void): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const ctx = c.getContext('2d')!;
  draw(ctx);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(3, 3);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export type PatternMap = Partial<Record<Exclude<PatternKey, 'none'>, THREE.CanvasTexture>>;

export function buildPatterns(): PatternMap {
  return {
    starburst: makeTexture((ctx) => {
      ctx.fillStyle = '#1a1f3c';
      ctx.fillRect(0, 0, 512, 512);
      ctx.fillStyle = '#f5a623';
      ctx.save();
      ctx.translate(256, 256);
      for (let i = 0; i < 8; i++) {
        ctx.rotate(Math.PI / 4);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(30, 160);
        ctx.lineTo(-30, 160);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
      ctx.beginPath();
      ctx.arc(256, 256, 50, 0, Math.PI * 2);
      ctx.fillStyle = '#e84040';
      ctx.fill();
    }),

    pins: makeTexture((ctx) => {
      ctx.fillStyle = '#e84040';
      ctx.fillRect(0, 0, 512, 512);
      const drawPin = (x: number, y: number) => {
        ctx.fillStyle = '#f5f0e8';
        ctx.beginPath();
        ctx.ellipse(x, y + 40, 12, 22, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x, y, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#e84040';
        ctx.fillRect(x - 12, y + 22, 24, 6);
      };
      ([[128, 128], [384, 128], [256, 300], [64, 400], [448, 400]] as const).forEach(
        ([x, y]) => drawPin(x, y)
      );
    }),

    argyle: makeTexture((ctx) => {
      ctx.fillStyle = '#f5f0e8';
      ctx.fillRect(0, 0, 512, 512);
      (
        [
          [256, 128, '#1a1f3c'],
          [128, 256, '#e84040'],
          [384, 256, '#e84040'],
          [256, 384, '#1a1f3c'],
        ] as const
      ).forEach(([cx, cy, col]) => {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(Math.PI / 4);
        ctx.fillStyle = col;
        ctx.fillRect(-70, -70, 140, 140);
        ctx.restore();
      });
      ctx.strokeStyle = '#1a1f3c';
      ctx.lineWidth = 1;
      for (let i = 0; i < 512; i += 128) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, 512);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(512, i);
        ctx.stroke();
      }
    }),

    polka: makeTexture((ctx) => {
      ctx.fillStyle = '#1a1f3c';
      ctx.fillRect(0, 0, 512, 512);
      ([[128, 128], [384, 128], [256, 256], [128, 384], [384, 384]] as const).forEach(
        ([x, y]) => {
          ctx.beginPath();
          ctx.arc(x, y, 55, 0, Math.PI * 2);
          ctx.fillStyle = '#f5f0e8';
          ctx.fill();
        }
      );
      ([[256, 128], [128, 256], [384, 256], [256, 384]] as const).forEach(([x, y]) => {
        ctx.beginPath();
        ctx.arc(x, y, 20, 0, Math.PI * 2);
        ctx.fillStyle = '#e84040';
        ctx.fill();
      });
    }),

    chevrons: makeTexture((ctx) => {
      const W = 512,
        ROW = 64;
      for (let row = 0; row < W / ROW; row++) {
        ctx.fillStyle = row % 2 === 0 ? '#1a1f3c' : '#f5a623';
        ctx.beginPath();
        const y0 = row * ROW,
          y1 = y0 + ROW;
        ctx.moveTo(0, y0);
        ctx.lineTo(W, y0);
        ctx.lineTo(W, y1);
        ctx.lineTo(W / 2, y1 - 24);
        ctx.lineTo(0, y1);
        ctx.closePath();
        ctx.fill();
      }
    }),

    bowtie: makeTexture((ctx) => {
      ctx.fillStyle = '#1a1f3c';
      ctx.fillRect(0, 0, 512, 512);
      const drawBowtie = (cx: number, cy: number) => {
        ctx.fillStyle = '#f5a623';
        ctx.beginPath();
        ctx.moveTo(cx - 50, cy - 30);
        ctx.lineTo(cx, cy);
        ctx.lineTo(cx - 50, cy + 30);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(cx + 50, cy - 30);
        ctx.lineTo(cx, cy);
        ctx.lineTo(cx + 50, cy + 30);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx, cy, 8, 0, Math.PI * 2);
        ctx.fillStyle = '#e84040';
        ctx.fill();
      };
      ([[128, 128], [384, 128], [256, 256], [128, 384], [384, 384]] as const).forEach(
        ([x, y]) => drawBowtie(x, y)
      );
    }),
  };
}

let _patterns: PatternMap | null = null;
export function getPatterns(): PatternMap | null {
  if (typeof window === 'undefined') return null;
  if (!_patterns) _patterns = buildPatterns();
  return _patterns;
}
