'use client';
import { useStore } from '@/lib/store';

export default function CartDrawer() {
  const items = useStore((s) => s.cartItems);
  const open = useStore((s) => s.cartOpen);
  const setOpen = useStore((s) => s.setCartOpen);
  const remove = useStore((s) => s.removeFromCart);

  const total = items.reduce((sum, i) => sum + i.price, 0);

  return (
    <>
      {/* Floating cart button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed top-4 right-4 z-40 btn-primary flex items-center gap-2 shadow-lg"
        aria-label="open cart"
      >
        🛒 <span>{items.length}</span>
      </button>

      {/* Backdrop */}
      <div
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Drawer */}
      <aside
        className={`fixed top-0 right-0 z-50 h-full w-[92vw] max-w-sm bg-navy border-l border-cream/15 shadow-2xl transition-transform duration-300 flex flex-col ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-5 border-b border-cream/10">
          <h2 className="font-display text-3xl">Your Cart</h2>
          <button onClick={() => setOpen(false)} className="text-cream/60 hover:text-cream text-2xl">
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-3">
          {items.length === 0 && (
            <p className="text-cream/50 text-center mt-10">
              Your cart is empty. Design a shirt and hit <em>Add to cart</em>.
            </p>
          )}
          {items.map((i) => (
            <div key={i.id} className="card p-3 flex gap-3 items-center">
              {i.thumbnail ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={i.thumbnail}
                  alt="custom shirt preview"
                  className="w-16 h-16 object-cover rounded-lg bg-navydeep"
                />
              ) : (
                <div
                  className="w-16 h-16 rounded-lg border border-cream/20"
                  style={{ background: i.bodyColor }}
                />
              )}
              <div className="flex-1">
                <p className="font-semibold">Strike Series</p>
                <p className="text-cream/60 text-xs">
                  Size {i.size} · Qty {i.qty}
                  {i.backText ? ` · “${i.backText}”` : ''}
                </p>
                <p className="text-gold text-sm">${i.price}.00</p>
              </div>
              <button onClick={() => remove(i.id)} className="text-coral text-sm hover:underline">
                Remove
              </button>
            </div>
          ))}
        </div>

        <div className="p-5 border-t border-cream/10">
          <div className="flex justify-between mb-3">
            <span className="text-cream/70">Subtotal</span>
            <span className="font-display text-2xl">${total}.00</span>
          </div>
          <button
            className="btn-primary w-full text-lg disabled:opacity-40"
            disabled={items.length === 0}
            onClick={() => alert('Demo checkout. This is where Stripe would take over.')}
          >
            Checkout
          </button>
          <p className="text-cream/40 text-xs text-center mt-2">Free shipping over $150</p>
        </div>
      </aside>
    </>
  );
}
