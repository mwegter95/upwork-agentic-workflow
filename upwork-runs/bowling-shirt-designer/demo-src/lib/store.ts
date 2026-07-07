import { create } from 'zustand';

export type PatternKey =
  | 'none'
  | 'starburst'
  | 'pins'
  | 'argyle'
  | 'polka'
  | 'chevrons'
  | 'bowtie';

export interface ImageTransform {
  scale: number;    // zoom, default 1.0
  offsetX: number;  // -1..1 in canvas fraction, default 0
  offsetY: number;
  rotation: number; // degrees, default 0
}

const DEFAULT_TRANSFORM: ImageTransform = { scale: 1, offsetX: 0, offsetY: 0, rotation: 0 };

export interface CartItem {
  id: string;
  size: string;
  qty: number;
  bodyColor: string;
  collarColor: string;
  cuffColor: string;
  pattern: PatternKey;
  backText: string;
  price: number;
  thumbnail: string;
}

interface ShirtState {
  // Customizer
  bodyColor: string;
  collarColor: string;
  cuffColor: string;
  pattern: PatternKey;
  backText: string;
  textColor: string;
  fontSize: number;
  fontFamily: string;
  // Image upload
  uploadMode: 'wrap' | 'frontback';
  frontImage: HTMLImageElement | null;
  backImage: HTMLImageElement | null;
  mirrorSeam: boolean;
  frontTransform: ImageTransform;
  backTransform: ImageTransform;
  hasImage: boolean; // any upload active -> suppresses color/pattern active states
  // Product
  size: string;
  qty: number;
  // Cart / session
  cartItems: CartItem[];
  cartOpen: boolean;
  sessionId: string | null;
  // Actions
  setBodyColor: (c: string) => void;
  setCollarColor: (c: string) => void;
  setCuffColor: (c: string) => void;
  setPattern: (p: PatternKey) => void;
  setBackText: (t: string) => void;
  setTextColor: (c: string) => void;
  setFontSize: (n: number) => void;
  setFontFamily: (f: string) => void;
  setUploadMode: (m: 'wrap' | 'frontback') => void;
  setFrontImage: (img: HTMLImageElement | null) => void;
  setBackImage: (img: HTMLImageElement | null) => void;
  setMirrorSeam: (v: boolean) => void;
  setFrontTransform: (t: Partial<ImageTransform>) => void;
  setBackTransform: (t: Partial<ImageTransform>) => void;
  setSize: (s: string) => void;
  setQty: (n: number) => void;
  addToCart: (thumbnail: string) => void;
  removeFromCart: (id: string) => void;
  setCartOpen: (v: boolean) => void;
  setSessionId: (id: string) => void;
  hydrate: (partial: Partial<ShirtState>) => void;
  reset: () => void;
}

export const PRICE = 89;

const DEFAULTS = {
  bodyColor: '#f5f4f0',
  collarColor: '#ececea',
  cuffColor: '#e7e7e3',
  pattern: 'none' as PatternKey,
  backText: '',
  textColor: '#f5f0e8',
  fontSize: 72,
  fontFamily: 'Impact',
  uploadMode: 'wrap' as 'wrap' | 'frontback',
  frontImage: null as HTMLImageElement | null,
  backImage: null as HTMLImageElement | null,
  mirrorSeam: false,
  frontTransform: { ...DEFAULT_TRANSFORM },
  backTransform: { ...DEFAULT_TRANSFORM },
  hasImage: false,
  size: 'M',
  qty: 1,
};

function uid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'id-' + Math.random().toString(36).slice(2, 10);
}

export const useStore = create<ShirtState>((set) => ({
  ...DEFAULTS,
  cartItems: [],
  cartOpen: false,
  sessionId: null,

  setBodyColor: (c) => set({ bodyColor: c }),
  setCollarColor: (c) => set({ collarColor: c }),
  setCuffColor: (c) => set({ cuffColor: c }),
  setPattern: (p) => set({ pattern: p }),
  setBackText: (t) => set({ backText: t.slice(0, 16) }),
  setTextColor: (c) => set({ textColor: c }),
  setFontSize: (n) => set({ fontSize: n }),
  setFontFamily: (f) => set({ fontFamily: f }),
  setUploadMode: (m) => set({ uploadMode: m }),
  setFrontImage: (img) =>
    set((s) => ({ frontImage: img, hasImage: !!(img || s.backImage) })),
  setBackImage: (img) =>
    set((s) => ({ backImage: img, hasImage: !!(img || s.frontImage) })),
  setMirrorSeam: (v) => set({ mirrorSeam: v }),
  setFrontTransform: (t) => set((s) => ({ frontTransform: { ...s.frontTransform, ...t } })),
  setBackTransform: (t) => set((s) => ({ backTransform: { ...s.backTransform, ...t } })),
  setSize: (s) => set({ size: s }),
  setQty: (n) => set({ qty: Math.max(1, Math.min(99, n)) }),

  addToCart: (thumbnail) =>
    set((s) => ({
      cartOpen: true,
      cartItems: [
        ...s.cartItems,
        {
          id: uid(),
          size: s.size,
          qty: s.qty,
          bodyColor: s.bodyColor,
          collarColor: s.collarColor,
          cuffColor: s.cuffColor,
          pattern: s.pattern,
          backText: s.backText,
          price: PRICE * s.qty,
          thumbnail,
        },
      ],
    })),
  removeFromCart: (id) =>
    set((s) => ({ cartItems: s.cartItems.filter((i) => i.id !== id) })),
  setCartOpen: (v) => set({ cartOpen: v }),
  setSessionId: (id) => set({ sessionId: id }),
  hydrate: (partial) => set((s) => ({ ...s, ...partial })),
  reset: () => set({ ...DEFAULTS }),
}));
