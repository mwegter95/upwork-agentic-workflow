'use client';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';

const ShirtCanvas = dynamic(() => import('./ShirtCanvas'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-navy animate-pulse rounded-2xl flex items-center justify-center">
      <span className="font-display text-2xl text-gold/60">Loading 3D studio…</span>
    </div>
  ),
});

export default function ShirtCustomizer() {
  return (
    <div id="shirt-canvas" className="w-full h-full">
      <Suspense
        fallback={<div className="w-full h-full bg-navy animate-pulse rounded-2xl" />}
      >
        <ShirtCanvas />
      </Suspense>
    </div>
  );
}
