/**
 * Loader for public/shirt.bin — the offline-draped garment mesh produced by
 * tools/drape.mjs (cloth-simulated panels, welded seams, per-vertex baked AO).
 *
 * Format: 'SHRT' | u32 version | u32 jsonLen | JSON manifest | per-mesh blobs
 * (pos f32x3, nrm f32x3, uv f32x2, ao f32, idx u32).
 */
import * as THREE from 'three';

export interface ShirtMeshEntry {
  geometry: THREE.BufferGeometry;
  material: string; // 'fabric' | 'collar' | 'cuff' | 'tape' | 'metal'
  name: string;
}

let _cache: Promise<ShirtMeshEntry[]> | null = null;

export function loadShirtMeshes(url: string): Promise<ShirtMeshEntry[]> {
  if (_cache) return _cache;
  _cache = (async () => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`shirt.bin fetch failed: ${res.status}`);
    const buf = await res.arrayBuffer();
    const dv = new DataView(buf);
    const jsonLen = dv.getUint32(8, true);
    const json = JSON.parse(
      new TextDecoder().decode(new Uint8Array(buf, 12, jsonLen)).replace(/\0+$/, '')
    );
    const base = 12 + jsonLen;
    const out: ShirtMeshEntry[] = [];
    for (const m of json.meshes) {
      let o = base + m.offset;
      const pos = new Float32Array(buf, o, m.v * 3); o += m.v * 12;
      const nrm = new Float32Array(buf, o, m.v * 3); o += m.v * 12;
      const uv = new Float32Array(buf, o, m.v * 2); o += m.v * 8;
      const ao = new Float32Array(buf, o, m.v); o += m.v * 4;
      const idx = new Uint32Array(buf, o, m.i);
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      g.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
      g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
      // baked AO -> vertex color (multiplies the design map)
      const col = new Float32Array(m.v * 3);
      for (let i = 0; i < m.v; i++) {
        col[i * 3] = col[i * 3 + 1] = col[i * 3 + 2] = ao[i];
      }
      g.setAttribute('color', new THREE.BufferAttribute(col, 3));
      g.setIndex(new THREE.BufferAttribute(idx, 1));
      out.push({ geometry: g, material: m.material, name: m.name });
    }
    return out;
  })();
  return _cache;
}
