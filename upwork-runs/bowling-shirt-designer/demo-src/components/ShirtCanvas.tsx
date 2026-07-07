'use client';
import { useMemo, useEffect, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { useStore } from '@/lib/store';
import { getPatterns } from '@/lib/patterns';
import { getCompositorTexture, scheduleRecompose } from '@/lib/compositor';
import { loadShirtMeshes, type ShirtMeshEntry } from '@/lib/shirtMesh';

const BASE = '/demos/bowling-shirt-designer';

// --- Procedural knit-fabric micro normal map (tiled over the whole garment) ---
function makeKnitNormal(): THREE.CanvasTexture {
  const N = 256;
  const c = document.createElement('canvas');
  c.width = c.height = N;
  const ctx = c.getContext('2d')!;
  const img = ctx.createImageData(N, N);
  const height = (x: number, y: number) => {
    const u = (x / N) * Math.PI * 2 * 30;
    const v = (y / N) * Math.PI * 2 * 30;
    return (
      Math.sin(u) * Math.cos(v) * 0.5 +
      Math.sin(u * 0.5 + v) * 0.3 +
      Math.sin((u - v) * 0.25) * 0.2
    );
  };
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const hL = height((x - 1 + N) % N, y);
      const hR = height((x + 1) % N, y);
      const hD = height(x, (y - 1 + N) % N);
      const hU = height(x, (y + 1) % N);
      const nx = hL - hR;
      const ny = hD - hU;
      const len = Math.hypot(nx, ny, 1);
      const i = (y * N + x) * 4;
      img.data[i] = ((nx / len) * 0.5 + 0.5) * 255;
      img.data[i + 1] = ((ny / len) * 0.5 + 0.5) * 255;
      img.data[i + 2] = ((1 / len) * 0.5 + 0.5) * 255;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(42, 42);
  return t;
}

/** Replaces drei's <Environment preset> (which fetches HDRs from a CDN) with a
 *  locally generated studio room environment. Zero network, deterministic. */
function StudioEnvironment() {
  const { gl, scene } = useThree();
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    return () => {
      scene.environment = null;
      env.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);
  return null;
}

function ShirtModel() {
  const state = useStore();
  const [meshes, setMeshes] = useState<ShirtMeshEntry[] | null>(null);
  const compositorTexture = useMemo(() => getCompositorTexture(), []);
  const patterns = useMemo(() => getPatterns(), []);
  const knit = useMemo(() => makeKnitNormal(), []);

  useEffect(() => {
    let alive = true;
    loadShirtMeshes(`${BASE}/shirt.bin`).then((m) => { if (alive) setMeshes(m); });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    scheduleRecompose({
      baseColor: state.bodyColor,
      pattern:
        patterns && state.pattern !== 'none'
          ? patterns[state.pattern as keyof typeof patterns] ?? null
          : null,
      frontImage: state.frontImage,
      backImage: state.backImage,
      frontTransform: state.frontTransform,
      backTransform: state.backTransform,
      uploadMode: state.uploadMode,
      mirrorSeam: state.mirrorSeam,
      backText: state.backText,
      textColor: state.textColor,
      fontSize: state.fontSize,
      fontFamily: state.fontFamily,
    });
  }, [
    state.bodyColor, state.pattern,
    state.frontImage, state.backImage,
    state.frontTransform, state.backTransform,
    state.uploadMode, state.mirrorSeam,
    state.backText, state.textColor, state.fontSize, state.fontFamily,
    patterns,
  ]);

  const materials = useMemo(() => {
    return {
      fabric: new THREE.MeshPhysicalMaterial({
        map: compositorTexture,
        vertexColors: true,
        normalMap: knit,
        normalScale: new THREE.Vector2(0.35, 0.35),
        roughness: 0.82,
        metalness: 0,
        sheen: 0.55,
        sheenRoughness: 0.6,
        sheenColor: new THREE.Color('#ffffff'),
        envMapIntensity: 0.55,
        side: THREE.FrontSide,
      }),
      lining: new THREE.MeshStandardMaterial({
        color: '#cfcbc6', roughness: 0.95, side: THREE.BackSide,
      }),
      collar: new THREE.MeshPhysicalMaterial({
        color: state.collarColor,
        vertexColors: true,
        normalMap: knit,
        normalScale: new THREE.Vector2(0.3, 0.3),
        roughness: 0.78,
        sheen: 0.4,
        envMapIntensity: 0.5,
        side: THREE.FrontSide,
      }),
      collarLining: new THREE.MeshStandardMaterial({
        color: '#d8d5d0', roughness: 0.95, side: THREE.BackSide,
      }),
      cuff: new THREE.MeshPhysicalMaterial({
        color: state.cuffColor, roughness: 0.8, sheen: 0.3,
        envMapIntensity: 0.5, side: THREE.DoubleSide,
      }),
      tape: new THREE.MeshStandardMaterial({
        color: '#e8e6e2', roughness: 0.85, side: THREE.DoubleSide,
      }),
      metal: new THREE.MeshStandardMaterial({
        color: '#b9bcc2', roughness: 0.35, metalness: 0.9, side: THREE.DoubleSide,
      }),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [compositorTexture, knit]);

  // live trim recolors without rebuilding materials
  useEffect(() => { materials.collar.color.set(state.collarColor); }, [materials, state.collarColor]);
  useEffect(() => { materials.cuff.color.set(state.cuffColor); }, [materials, state.cuffColor]);

  if (!meshes) return null;

  return (
    <group>
      {meshes.map((m) => {
        const mat = (materials as any)[m.material] ?? materials.fabric;
        return (
          <group key={m.name}>
            <mesh geometry={m.geometry} material={mat} castShadow receiveShadow />
            {m.material === 'fabric' && (
              <mesh geometry={m.geometry} material={materials.lining} />
            )}
            {m.material === 'collar' && (
              <mesh geometry={m.geometry} material={materials.collarLining} />
            )}
          </group>
        );
      })}
    </group>
  );
}

export default function ShirtCanvas() {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      gl={{
        preserveDrawingBuffer: true,
        antialias: true,
        toneMapping: THREE.ACESFilmicToneMapping,
      }}
      camera={{ position: [0.32, 0.42, 1.72], fov: 30 }}
      style={{ background: '#f1f0ee' }}
    >
      <StudioEnvironment />
      <ambientLight intensity={0.25} />
      <directionalLight
        position={[0.8, 1.6, 1.2]}
        intensity={1.6}
        color="#fff8ef"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-radius={6}
      />
      <directionalLight position={[-1.2, 0.4, 0.6]} intensity={0.5} color="#eef2ff" />
      <ShirtModel />
      <ContactShadows position={[0, -0.44, 0]} opacity={0.35} scale={1.8} blur={2.2} far={0.7} />
      <OrbitControls
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        minDistance={1.1}
        maxDistance={3.2}
        autoRotate
        autoRotateSpeed={0.7}
        target={[0, 0.08, 0]}
      />
    </Canvas>
  );
}
