'use client';
import { useEffect, useState } from 'react';
import { useStore, PatternKey, ImageTransform } from '@/lib/store';
import { contentBbox, imglyRefine, boxToTransform, hasWebGPU } from '@/lib/smartAlign';

const API = 'https://api.michaelwegter.com/bowling';

const BODY_COLORS = ['#e84040', '#1a1f3c', '#f5a623', '#f5f0e8', '#2e8b57', '#7b3fa0', '#0d0d0d', '#0e7c9e'];
const TRIM_COLORS = ['#1a1f3c', '#f5a623', '#e84040', '#f5f0e8', '#ffffff', '#0d0d0d'];
const PATTERNS: { key: PatternKey; label: string }[] = [
  { key: 'none', label: 'Solid' },
  { key: 'starburst', label: 'Starburst' },
  { key: 'pins', label: 'Ten Pin' },
  { key: 'argyle', label: 'Argyle' },
  { key: 'polka', label: 'Polka' },
  { key: 'chevrons', label: 'Chevron' },
  { key: 'bowtie', label: 'Bowtie' },
];
const FONTS = ['Impact', 'Georgia', 'Courier New', 'Arial Black'];
const SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL'];

function Swatch({
  color,
  active,
  onClick,
}: {
  color: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={`color ${color}`}
      onClick={onClick}
      className="swatch"
      style={{
        background: color,
        borderColor: active ? '#f5a623' : 'rgba(245,240,232,0.25)',
        transform: active ? 'scale(1.12)' : 'scale(1)',
      }}
    />
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-cream/10 pb-4">
      <h3 className="font-display text-xl text-gold mb-2.5 tracking-wide">{title}</h3>
      {children}
    </div>
  );
}

function SliderRow({ label, min, max, step, value, onChange }: {
  label: string; min: number; max: number; step: number;
  value: number; onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-2 mb-1">
      <span className="text-xs text-cream/60 w-12 shrink-0">{label}</span>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="flex-1 accent-coral" />
      <span className="text-xs text-cream/50 w-10 text-right">{value.toFixed(2)}</span>
    </div>
  );
}

function ImageUploadSlot({ label, hasImg, onLoad, onClear, transform, onTransform, onSmartAlign }: {
  label: string;
  hasImg: boolean;
  onLoad: (img: HTMLImageElement) => void;
  onClear: () => void;
  transform: ImageTransform;
  onTransform: (t: Partial<ImageTransform>) => void;
  onSmartAlign: (img: HTMLImageElement) => Promise<void>;
}) {
  const [currentImg, setCurrentImg] = useState<HTMLImageElement | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { setCurrentImg(img); onLoad(img); };
    img.src = url;
  }

  return (
    <div className="mb-3 p-3 rounded-lg bg-navy/30 border border-cream/10">
      <p className="text-xs font-ui text-cream/60 mb-1">{label}</p>
      <div className="flex items-center gap-2 mb-2">
        <input type="file" accept="image/*" onChange={handleFile}
          className="text-xs text-cream/80 flex-1
            file:mr-2 file:py-1 file:px-2 file:rounded file:border-0
            file:bg-coral file:text-white file:text-xs file:cursor-pointer" />
        {hasImg && (
          <button className="text-coral text-xs underline shrink-0"
            onClick={() => { setCurrentImg(null); onClear(); }}>Remove</button>
        )}
      </div>
      {currentImg && hasImg && (
        <>
          <button
            onClick={async () => { setAnalyzing(true); await onSmartAlign(currentImg); setAnalyzing(false); }}
            disabled={analyzing}
            className="w-full mb-2 py-1.5 rounded bg-gold text-navydeep text-xs font-semibold disabled:opacity-60"
          >
            {analyzing ? '✨ Analyzing…' : '✨ Smart Align'}
          </button>
          <SliderRow label="Zoom" min={0.3} max={4} step={0.01}
            value={transform.scale} onChange={(v) => onTransform({ scale: v })} />
          <SliderRow label="Pan X" min={-1} max={1} step={0.01}
            value={transform.offsetX} onChange={(v) => onTransform({ offsetX: v })} />
          <SliderRow label="Pan Y" min={-1} max={1} step={0.01}
            value={transform.offsetY} onChange={(v) => onTransform({ offsetY: v })} />
          <SliderRow label="Rotate" min={-180} max={180} step={1}
            value={transform.rotation} onChange={(v) => onTransform({ rotation: v })} />
        </>
      )}
    </div>
  );
}

function grabThumbnail(): string {
  const el = document.querySelector('#shirt-canvas canvas') as HTMLCanvasElement | null;
  try {
    return el ? el.toDataURL('image/png') : '';
  } catch {
    return '';
  }
}

export default function OptionsPanel() {
  const s = useStore();
  const [saving, setSaving] = useState(false);
  const [shareMsg, setShareMsg] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Hydrate from ?s=<id> (backend) or #d=<base64> (offline fallback) on mount.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sid = params.get('s');
    const hash = window.location.hash.startsWith('#d=')
      ? window.location.hash.slice(3)
      : null;
    if (sid) {
      fetch(`${API}/session/${sid}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((j) => {
          if (j?.data) s.hydrate(j.data);
        })
        .catch(() => {});
    } else if (hash) {
      try {
        s.hydrate(JSON.parse(decodeURIComponent(escape(atob(hash)))));
      } catch {
        /* ignore malformed share link */
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function snapshot() {
    return {
      bodyColor: s.bodyColor,
      collarColor: s.collarColor,
      cuffColor: s.cuffColor,
      pattern: s.pattern,
      backText: s.backText,
      textColor: s.textColor,
      fontSize: s.fontSize,
      fontFamily: s.fontFamily,
      size: s.size,
      qty: s.qty,
    };
  }

  async function saveAndShare() {
    setSaving(true);
    setShareMsg(null);
    const data = snapshot();
    let url: string;
    try {
      const res = await fetch(`${API}/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('bad status');
      const { id } = await res.json();
      url = `${window.location.origin}${window.location.pathname}?s=${id}`;
    } catch {
      // Offline / backend down: encode design in the URL hash so sharing still works.
      const enc = btoa(unescape(encodeURIComponent(JSON.stringify(data))));
      url = `${window.location.origin}${window.location.pathname}#d=${enc}`;
    }
    try {
      await navigator.clipboard.writeText(url);
      setShareMsg('Share link copied to clipboard');
    } catch {
      setShareMsg(url);
    }
    setSaving(false);
  }

  function randomize() {
    const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];
    s.setBodyColor(pick(BODY_COLORS));
    s.setCollarColor(pick(TRIM_COLORS));
    s.setCuffColor(pick(TRIM_COLORS));
    s.setPattern(pick(PATTERNS).key);
  }

  return (
    <div className="card p-5 flex flex-col gap-4 h-full overflow-y-auto">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-display text-3xl leading-none">Strike Series</p>
          <p className="text-cream/60 text-sm">Poly-blend camp shirt · ${'89'}.00</p>
        </div>
        <button onClick={randomize} className="btn-ghost text-sm" aria-label="randomize">
          🎲 Surprise me
        </button>
      </div>

      <Section title="Body Color">
        <div className="flex flex-wrap gap-2">
          {BODY_COLORS.map((c) => (
            <Swatch key={c} color={c} active={s.bodyColor === c && !s.hasImage}
              onClick={() => s.setBodyColor(c)} />
          ))}
        </div>
      </Section>

      <Section title="Pattern">
        <div className="grid grid-cols-4 gap-2">
          {PATTERNS.map((p) => (
            <button
              key={p.key}
              onClick={() => s.setPattern(p.key)}
              className={`text-xs py-2 rounded-lg border transition ${
                s.pattern === p.key && !s.hasImage
                  ? 'bg-coral border-coral text-white'
                  : 'border-cream/20 text-cream/80 hover:bg-cream/10'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Upload Artwork / Photo">
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => s.setUploadMode('wrap')}
            className={`flex-1 py-1.5 rounded-lg text-sm font-ui font-semibold transition ${
              s.uploadMode === 'wrap' ? 'bg-coral text-white' : 'bg-navy/40 text-cream/80'
            }`}
          >All-Around Wrap</button>
          <button
            onClick={() => s.setUploadMode('frontback')}
            className={`flex-1 py-1.5 rounded-lg text-sm font-ui font-semibold transition ${
              s.uploadMode === 'frontback' ? 'bg-coral text-white' : 'bg-navy/40 text-cream/80'
            }`}
          >Front / Back</button>
        </div>

        <ImageUploadSlot
          label={s.uploadMode === 'wrap' ? 'Image (wraps all the way around)' : 'Front Image'}
          hasImg={!!s.frontImage}
          onLoad={(img) => s.setFrontImage(img)}
          onClear={() => s.setFrontImage(null)}
          transform={s.frontTransform}
          onTransform={(t) => s.setFrontTransform(t)}
          onSmartAlign={(img) => {
            s.setFrontTransform(boxToTransform(contentBbox(img)));
            return imglyRefine(img).then((b) => s.setFrontTransform(boxToTransform(b)));
          }}
        />

        {s.uploadMode === 'frontback' && (
          <ImageUploadSlot
            label="Back Image (optional, uses front if blank)"
            hasImg={!!s.backImage}
            onLoad={(img) => s.setBackImage(img)}
            onClear={() => s.setBackImage(null)}
            transform={s.backTransform}
            onTransform={(t) => s.setBackTransform(t)}
            onSmartAlign={(img) => {
              s.setBackTransform(boxToTransform(contentBbox(img)));
              return imglyRefine(img).then((b) => s.setBackTransform(boxToTransform(b)));
            }}
          />
        )}

        {s.uploadMode === 'wrap' && s.frontImage && (
          <label className="flex items-center gap-2 text-xs font-ui text-cream/70 mt-1">
            <input type="checkbox" checked={s.mirrorSeam}
              onChange={(e) => s.setMirrorSeam(e.target.checked)} className="accent-coral" />
            Mirror seam edges (softens the back seam on non-tiling images)
          </label>
        )}
        <p className="text-cream/40 text-xs mt-1">
          Smart Align uses {mounted && hasWebGPU() ? 'WebGPU' : 'on-device'} subject detection to auto-center your design.
        </p>
      </Section>

      <Section title="Trim (Collar &amp; Sleeves)">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="text-cream/60 text-xs w-14">Collar</span>
            {TRIM_COLORS.map((c) => (
              <Swatch key={c} color={c} active={s.collarColor === c}
                onClick={() => s.setCollarColor(c)} />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-cream/60 text-xs w-14">Sleeves</span>
            {TRIM_COLORS.map((c) => (
              <Swatch key={c} color={c} active={s.cuffColor === c}
                onClick={() => s.setCuffColor(c)} />
            ))}
          </div>
        </div>
      </Section>

      <Section title="Name on Back">
        <input
          type="text"
          value={s.backText}
          maxLength={16}
          placeholder="Your name / team"
          onChange={(e) => s.setBackText(e.target.value)}
          className="w-full bg-navydeep border border-cream/20 rounded-lg px-3 py-2 text-cream placeholder:text-cream/30 focus:outline-none focus:border-gold"
        />
        <div className="flex items-center gap-3 mt-2 flex-wrap">
          <select
            value={s.fontFamily}
            onChange={(e) => s.setFontFamily(e.target.value)}
            className="bg-navydeep border border-cream/20 rounded-lg px-2 py-1.5 text-sm"
          >
            {FONTS.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
          <div className="flex items-center gap-2">
            <span className="text-cream/60 text-xs">Size</span>
            <input
              type="range"
              min={40}
              max={120}
              value={s.fontSize}
              onChange={(e) => s.setFontSize(Number(e.target.value))}
              className="accent-coral"
            />
          </div>
          <div className="flex items-center gap-1.5">
            {['#f5f0e8', '#f5a623', '#e84040', '#1a1f3c', '#ffffff'].map((c) => (
              <Swatch key={c} color={c} active={s.textColor === c}
                onClick={() => s.setTextColor(c)} />
            ))}
          </div>
        </div>
      </Section>

      <Section title="Size &amp; Quantity">
        <div className="flex items-center justify-between gap-3">
          <div className="flex gap-1.5 flex-wrap">
            {SIZES.map((sz) => (
              <button
                key={sz}
                onClick={() => s.setSize(sz)}
                className={`w-10 h-10 rounded-lg border text-sm font-semibold transition ${
                  s.size === sz
                    ? 'bg-gold border-gold text-navydeep'
                    : 'border-cream/20 text-cream/80 hover:bg-cream/10'
                }`}
              >
                {sz}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button className="btn-ghost px-3 py-1" onClick={() => s.setQty(s.qty - 1)}>-</button>
            <span className="w-8 text-center font-semibold">{s.qty}</span>
            <button className="btn-ghost px-3 py-1" onClick={() => s.setQty(s.qty + 1)}>+</button>
          </div>
        </div>
      </Section>

      <div className="flex flex-col gap-2 mt-auto pt-1">
        <button className="btn-primary text-lg" onClick={() => s.addToCart(grabThumbnail())}>
          Add to cart · ${s.qty * 89}.00
        </button>
        <button className="btn-ghost text-sm" onClick={saveAndShare} disabled={saving}>
          {saving ? 'Saving…' : '🔗 Save & share this design'}
        </button>
        {shareMsg && <p className="text-gold text-xs break-all">{shareMsg}</p>}
      </div>
    </div>
  );
}
