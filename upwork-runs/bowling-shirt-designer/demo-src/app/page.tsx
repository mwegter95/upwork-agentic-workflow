import ShirtCustomizer from '@/components/ShirtCustomizer';
import OptionsPanel from '@/components/OptionsPanel';
import CartDrawer from '@/components/CartDrawer';
import AuditSection from '@/components/AuditSection';

export default function Home() {
  return (
    <main className="min-h-screen">
      <CartDrawer />

      {/* Top bar */}
      <header className="flex items-center justify-between px-5 md:px-10 py-5">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎳</span>
          <span className="font-display text-2xl tracking-widest">STRIKEHOUSE</span>
        </div>
        <nav className="hidden md:flex gap-7 text-sm text-cream/70 font-ui">
          <a href="#studio" className="hover:text-gold transition">Design Studio</a>
          <a href="#audit" className="hover:text-gold transition">Engineering</a>
        </nav>
      </header>

      {/* Hero */}
      <section className="px-5 md:px-10 pt-6 pb-10 max-w-6xl mx-auto text-center">
        <p className="font-display text-gold text-xl tracking-widest">Retro league · Modern fabric</p>
        <h1 className="font-display text-6xl md:text-8xl leading-[0.9] mt-2">
          Build your <span className="text-coral">bowling shirt</span> in 3D
        </h1>
        <p className="text-cream/70 max-w-2xl mx-auto mt-5 text-lg">
          Spin the shirt, swap colors and retro patterns, drop in your own artwork, and print your
          team name across the back. Every change renders live. No lag, no dead clicks.
        </p>
        <a href="#studio" className="btn-primary inline-block mt-7 text-lg">Start designing ↓</a>
      </section>

      {/* Studio: 3D canvas + options */}
      <section id="studio" className="px-5 md:px-10 pb-16 max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-[1.15fr_1fr] gap-6">
          <div className="card overflow-hidden h-[480px] lg:h-[640px] relative">
            <div className="absolute top-3 left-4 z-10 text-cream/50 text-xs font-ui pointer-events-none">
              drag to rotate · scroll to zoom
            </div>
            <ShirtCustomizer />
          </div>
          <div className="h-[640px]">
            <OptionsPanel />
          </div>
        </div>
      </section>

      <AuditSection />

      <footer className="text-center text-cream/40 text-sm py-10 border-t border-cream/10">
        Strikehouse is a demo build · Michael Wegter · github.com/mwegter95
      </footer>
    </main>
  );
}
