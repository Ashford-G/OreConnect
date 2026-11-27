import { prices } from "../data";
export default function Ticker() {
  const row = [...prices, ...prices];
  return (
    <div className="overflow-hidden bg-ink text-white/80 text-xs py-2">
      <div className="flex w-max animate-marquee gap-10">
        {row.map(([s, p, u, c], i) => (
          <span key={i} className="flex gap-2 whitespace-nowrap">
            <b className="text-white">{s}</b>${p}/{u}
            <span className={c >= 0 ? "text-emerald-400" : "text-ore"}>{c >= 0 ? "+" : ""}{c}%</span>
          </span>
        ))}
      </div>
    </div>
  );
}
