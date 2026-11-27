import { BadgeCheck, MapPin, Star, Gem, FileText, Truck, HardHat, Wrench, Briefcase, Mountain, Gavel, Phone } from "lucide-react";
import { categories, lots, steps, footer } from "../data";

const icons = [Gem, FileText, Truck, HardHat, Wrench, Briefcase, Mountain, Gavel];
const stats = [["$184M", "Escrow volume"], ["3,200+", "Verified sellers"], ["48h", "Avg. assay turnaround"], ["14", "Countries"]];

export function Stats() {
  return (
    <section className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-6 py-14 md:grid-cols-4">
      {stats.map(([v, l]) => <div key={l}><p className="font-display text-4xl font-black">{v}</p><p className="text-sm text-black/60">{l}</p></div>)}
    </section>
  );
}

export function Categories() {
  return (
    <section id="categories" className="mx-auto max-w-6xl px-6 py-14">
      <h2 className="font-display text-4xl font-black">Everything a mine needs.</h2>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {categories.map(([t, d], i) => { const I = icons[i]; return (
          <a key={t} href="#" className="group rounded-2xl bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
            <I className="text-ore" /><h3 className="mt-4 font-semibold">{t}</h3><p className="text-sm text-black/60">{d}</p>
          </a>); })}
      </div>
    </section>
  );
}

export function Lots() {
  return (
    <section id="lots" className="mx-auto max-w-6xl px-6 py-14">
      <div className="flex items-end justify-between"><h2 className="font-display text-4xl font-black">Featured verified lots</h2><a href="#" className="text-sm font-semibold text-ore">See all →</a></div>
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {lots.map(([price, t, d, badges, loc, r, im]) => (
          <article key={t} className="overflow-hidden rounded-2xl bg-white shadow-sm">
            <img src={im} alt={t} className="h-40 w-full object-cover" />
            <div className="p-5">
              <p className="font-bold text-ore">{price}</p><h3 className="mt-1 font-semibold">{t}</h3><p className="text-sm text-black/60">{d}</p>
              <div className="mt-3 flex flex-wrap gap-1">{badges.map((b) => <span key={b} className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700"><BadgeCheck size={12} />{b}</span>)}</div>
              <div className="mt-4 flex items-center justify-between text-sm text-black/60">
                <span className="flex items-center gap-1"><MapPin size={14} />{loc}</span><span className="flex items-center gap-1"><Star size={14} className="fill-gold text-gold" />{r}</span>
              </div>
              <a href="#" className="mt-4 block rounded-full bg-ink py-2 text-center text-sm font-semibold text-white hover:bg-ore">View</a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function HowItWorks() {
  return (
    <section className="bg-ink py-20 text-white">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="font-display text-4xl font-black">How it works</h2>
        <div className="mt-10 grid gap-8 md:grid-cols-4">
          {steps.map(([t, d], i) => <div key={t} className="border-t border-white/15 pt-6"><p className="font-display text-5xl text-gold">0{i + 1}</p><h3 className="mt-3 font-semibold">{t}</h3><p className="mt-2 text-sm text-white/60">{d}</p></div>)}
        </div>
      </div>
    </section>
  );
}

export function Trust() {
  return (
    <section className="mx-auto grid max-w-6xl gap-6 px-6 py-20 md:grid-cols-2">
      <div className="rounded-3xl bg-white p-10">
        <h2 className="font-display text-4xl font-black">Trust, built in.</h2>
        <p className="mt-4 text-black/60">Reviews only after completed deals. Chain-of-custody for every lot. Restricted goods need licence checks. Escrow on every major trade.</p>
        <div className="mt-6 flex flex-wrap gap-2">{["Identity", "Business", "Licence", "Lab"].map((b) => <span key={b} className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-sm text-emerald-700"><BadgeCheck size={14} />{b} verified</span>)}</div>
      </div>
      <div className="rounded-3xl bg-ore p-10 text-white">
        <Phone /><h2 className="mt-4 font-display text-4xl font-black">No smartphone? No problem.</h2>
        <p className="mt-4 text-white/85">Dial <b>*727#</b> or message us on WhatsApp to list ore and check prices. Low-data mode for remote sites.</p>
        <a href="#" className="mt-6 inline-block rounded-full bg-white px-6 py-3 text-sm font-semibold text-ore">Learn more</a>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="bg-ink px-6 py-16 text-white/70">
      <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-5">
        <div><p className="text-lg font-bold text-white">OreConnect</p><p className="mt-3 text-sm">The verified marketplace for mining — from pit to port.</p><p className="mt-3 text-xs">USSD *727# · WhatsApp 0786231767</p></div>
        {Object.entries(footer).map(([h, items]) => (
          <div key={h}><p className="font-semibold text-white">{h}</p><ul className="mt-3 space-y-2 text-sm">{items.map((i) => <li key={i}><a href="#" className="hover:text-white">{i}</a></li>)}</ul></div>
        ))}
      </div>
      <p className="mx-auto mt-12 max-w-6xl border-t border-white/10 pt-6 text-xs">© {new Date().getFullYear()} OreConnect. All rights reserved.</p>
    </footer>
  );
}
