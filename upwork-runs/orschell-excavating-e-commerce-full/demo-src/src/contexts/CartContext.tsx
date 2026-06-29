import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { cartApi } from '../api/client';
import { useAuth } from './AuthContext';

interface CartItem {
  id: number;
  product_id: number;
  quantity: number;
  name: string;
  price: number;
  image_url: string;
  sku: string;
  slug: string;
  stock: number;
}

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  loading: boolean;
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  addItem: (productId: number, qty?: number) => Promise<void>;
  updateItem: (id: number, qty: number) => Promise<void>;
  removeItem: (id: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refresh: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) { setItems([]); return; }
    try {
      setLoading(true);
      const r = await cartApi.get();
      setItems(r.data.items || []);
    } catch { setItems([]); }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  const addItem = useCallback(async (productId: number, qty = 1) => {
    const r = await cartApi.addItem(productId, qty);
    setItems(r.data.items || []);
    setDrawerOpen(true);
  }, []);

  const updateItem = useCallback(async (id: number, qty: number) => {
    const r = await cartApi.updateItem(id, qty);
    setItems(r.data.items || []);
  }, []);

  const removeItem = useCallback(async (id: number) => {
    const r = await cartApi.removeItem(id);
    setItems(r.data.items || []);
  }, []);

  const clearCart = useCallback(async () => {
    const r = await cartApi.clear();
    setItems(r.data.items || []);
  }, []);

  const itemCount = items.reduce((s, i) => s + i.quantity, 0);
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{
      items, itemCount, subtotal, loading,
      drawerOpen, openDrawer: () => setDrawerOpen(true), closeDrawer: () => setDrawerOpen(false),
      addItem, updateItem, removeItem, clearCart, refresh,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be inside CartProvider');
  return ctx;
}
