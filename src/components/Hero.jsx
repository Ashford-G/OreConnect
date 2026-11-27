import { useEffect, useState } from "react";
import { ArrowUpRight, Menu, X, Pickaxe, Instagram, Youtube, Twitter } from "lucide-react";
import { nav, img } from "../data";

function Logo() {
  return <a href="#" className="flex items-center gap-2 text-white font-bold text-lg"><Pickaxe className="text-ore" size={22} />OreConnect</a>;
}

export default function Hero() {
  const [open, setOpen] = useState(false);
  const [slide, setSlide] = useState(0);
  useEffect(() => { const t = setInterval(() => setSlide((s) => (s + 1) % img.slides.length), 4500); return () => clearInterval(t); }, []);
  const [src, title, text] = img.slides[slide];

  return (
    <section className="p-3 sm:p-6">
      <div className="relative overflow-hidden rounded-[28px] min-h-[92vh] text-white shadow-2xl">
        <img src={img.hero} alt="Open-pit mine at dusk" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />

        <header className="relative z-10 flex items-center justify-between border-b border-white/10 px-6 py-5 lg:px-12">
          <Logo />
          <nav className="hidden lg:flex gap-7 text-sm text-white/70">
            {nav.map((n) => <a key={n} href="#" className="hover:text-white transition">{n}</a>)}
          </nav>
          <div className="hidden lg:flex items-center gap-4">
            <a href="#" className="text-sm text-white/80 hover:text-white">Log in</a>
            <a href="#" className="rounded-full bg-ore px-5 py-2.5 text-sm font-semibold hover:brightness-110">Join free</a>
          </div>
          <button className="lg:hidden" onClick={() => setOpen(!open)} aria-label="Menu">{open ? <X /> : <Menu />}</button>
        </header>
        {open && (
          <div className="relative z-20 mx-4 mt-2 rounded-2xl bg-black/80 backdrop-blur p-5 lg:hidden flex flex-col gap-3">
            {nav.map((n) => <a key={n} href="#" className="text-white/80">{n}</a>)}
            <a href="#" className="mt-2 rounded-full bg-ore px-5 py-2.5 text-center font-semibold">Join free</a>
          </div>
        )}

        <div className="relative z-10 grid gap-10 px-6 pt-14 pb-32 lg:grid-cols-[1.4fr_1fr] lg:px-12 lg:pt-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/80 backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" /> 12,480 verified traders online
            </span>
            <h1 className="mt-6 font-display text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.02]">
              Dig deep.<br /><span className="text-gold">Trade verified.</span>
            </h1>
            <p className="mt-5 max-w-xl text-white/70">
              Minerals, machinery, supplies, services and jobs — one marketplace where every seller is checked and every deal is escrow-protected, from pit to port.
            </p>
            <div className="mt-8 flex items-center gap-2">
              <a href="#" className="rounded-full border border-white/15 bg-white/10 px-6 py-3 text-sm font-medium backdrop-blur hover:bg-white/20">Start trading</a>
              <a href="#lots" className="grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-white/10 backdrop-blur hover:bg-ore"><ArrowUpRight size={18} /></a>
              <a href="#lots" className="ml-4 text-sm text-white/70 underline-offset-4 hover:underline">Browse minerals</a>
            </div>
          </div>

          <div className="lg:justify-self-end w-full max-w-xs">
            <div className="rounded-2xl border border-white/15 bg-white/10 p-2 backdrop-blur">
              <img key={src} src={src} alt={title} className="h-44 w-full rounded-xl object-cover" />
              <div className="flex items-center justify-between px-2 py-2 text-xs text-white/70">
                <span>0{slide + 1}/0{img.slides.length}</span>
                <div className="flex gap-1">{img.slides.map((_, i) => <span key={i} className={`h-0.5 rounded ${i === slide ? "w-6 bg-white" : "w-4 bg-white/30"}`} />)}</div>
              </div>
            </div>
            <div className="mt-4 flex gap-4">
              <h3 className="text-2xl font-semibold">{title}</h3>
              <p className="text-xs text-white/60">{text}</p>
            </div>
          </div>
        </div>

        {/* rotating badge */}
        <a href="#categories" className="absolute bottom-24 left-1/2 z-10 hidden -translate-x-1/2 md:grid h-32 w-32 place-items-center rounded-full bg-black/40 backdrop-blur">
          <svg viewBox="0 0 100 100" className="absolute inset-0 animate-spin-slow">
            <defs><path id="c" d="M50,50 m-38,0 a38,38 0 1,1 76,0 a38,38 0 1,1 -76,0" /></defs>
            <text fill="white" fontSize="10" letterSpacing="3"><textPath href="#c">• EXPLORE MORE • EXPLORE MORE </textPath></text>
          </svg>
          <Pickaxe className="text-ore" />
        </a>

        <div className="absolute bottom-6 left-6 right-6 z-10 flex flex-wrap items-center justify-between gap-4 lg:left-12 lg:right-12">
          <div className="flex items-center gap-3">
            <div className="flex -space-x-3">
              {[11, 12, 32, 15].map((n) => <img key={n} src={`https://i.pravatar.cc/80?img=${n}`} alt="" className="h-10 w-10 rounded-full border-2 border-black" />)}
            </div>
            <span className="text-sm text-white/70">3,200+ verified sellers</span>
          </div>
          <div className="flex items-center gap-4 text-sm text-white/60">
            Follow us <Instagram size={16} /><Youtube size={16} /><Twitter size={16} />
          </div>
        </div>
      </div>
    </section>
  );
}
