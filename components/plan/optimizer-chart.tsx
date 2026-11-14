"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";

const usd = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
const W = 640;
const H = 240;
const P = { l: 52, r: 18, t: 18, b: 34 };

/**
 * The optimizer's search, drawn: money back at every FSA election it tested. The curve draws itself,
 * the best point and today's choice are marked, and hovering reads any point on the curve.
 */
export function OptimizerChart({ curve, best, current }: { curve: { election: number; total: number }[]; best: { election: number; total: number }; current: { election: number; total: number } }) {
  const [hover, setHover] = useState<number | null>(null);
  const { x, y, path, area, ticks } = useMemo(() => {
    const maxE = Math.max(1, ...curve.map((p) => p.election));
    const vals = curve.map((p) => p.total).concat(current.total);
    const lo = Math.min(...vals) * 0.85;
    const hi = Math.max(...vals) * 1.05;
    const x = (e: number) => P.l + (e / maxE) * (W - P.l - P.r);
    const y = (v: number) => H - P.b - ((v - lo) / Math.max(1, hi - lo)) * (H - P.t - P.b);
    const path = curve.map((p, i) => `${i ? "L" : "M"}${x(p.election).toFixed(1)},${y(p.total).toFixed(1)}`).join(" ");
    const area = `${path} L${x(curve.at(-1)!.election)},${H - P.b} L${x(0)},${H - P.b} Z`;
    const ticks = [0, 0.25, 0.5, 0.75, 1].map((k) => Math.round((maxE * k) / 250) * 250);
    return { x, y, path, area, ticks };
  }, [curve, current.total]);

  if (curve.length < 2) {
    return <p className="text-sm text-muted-foreground">No Dependent Care FSA is available to this family, so the plan uses the tax credit only.</p>;
  }
  const h = hover !== null ? curve[hover] : null;

  return (
    <figure>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full touch-none select-none"
        role="img"
        aria-label={`Money back by FSA election. Best: ${usd(best.total)} at ${usd(best.election)}.`}
        onPointerMove={(e) => {
          const r = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
          const px = ((e.clientX - r.left) / r.width) * W;
          let i = 0;
          for (let k = 1; k < curve.length; k++) if (Math.abs(x(curve[k].election) - px) < Math.abs(x(curve[i].election) - px)) i = k;
          setHover(i);
        }}
        onPointerLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id="opt-area" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--pine)" stopOpacity="0.18" />
            <stop offset="100%" stopColor="var(--pine)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={x(t)} x2={x(t)} y1={P.t} y2={H - P.b} stroke="rgb(23 42 38 / 0.06)" />
            <text x={x(t)} y={H - 12} textAnchor="middle" className="fill-[#4f625d] text-[11px]">{usd(t)}</text>
          </g>
        ))}
        <text x={P.l - 8} y={P.t + 4} textAnchor="end" className="fill-[#4f625d] text-[11px]">back</text>

        <motion.path d={area} fill="url(#opt-area)" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.6 }} />
        <motion.path
          d={path}
          fill="none"
          stroke="var(--pine)"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        />

        {/* today's choice */}
        <circle cx={x(Math.min(current.election, curve.at(-1)!.election))} cy={y(current.total)} r={6} fill="#fff" stroke="rgb(23 42 38 / 0.45)" strokeWidth={2.5} />
        <text x={x(Math.min(current.election, curve.at(-1)!.election)) + 10} y={y(current.total) + 16} className="fill-[#4f625d] text-[12px]">Today {usd(current.total)}</text>

        {/* best point */}
        <motion.g initial={{ scale: 0, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }} viewport={{ once: true }} transition={{ delay: 1.15, type: "spring", stiffness: 260, damping: 16 }} style={{ originX: `${x(best.election)}px`, originY: `${y(best.total)}px` }}>
          <circle cx={x(best.election)} cy={y(best.total)} r={14} fill="var(--marigold)" opacity={0.3} />
          <circle cx={x(best.election)} cy={y(best.total)} r={7} fill="var(--marigold)" stroke="#fff" strokeWidth={2.5} />
          <text x={x(best.election) - 12} y={y(best.total) - 18} textAnchor="end" className="fill-[#172a26] text-[13px] font-bold">Best {usd(best.total)}</text>
        </motion.g>

        {h && (
          <g pointerEvents="none">
            <line x1={x(h.election)} x2={x(h.election)} y1={P.t} y2={H - P.b} stroke="var(--pine)" strokeDasharray="3 4" />
            <circle cx={x(h.election)} cy={y(h.total)} r={5} fill="var(--pine)" />
            <rect x={Math.min(x(h.election) + 8, W - 150)} y={P.t} width={140} height={40} rx={8} fill="#172a26" />
            <text x={Math.min(x(h.election) + 18, W - 140)} y={P.t + 17} className="fill-white text-[12px]">FSA {usd(h.election)}</text>
            <text x={Math.min(x(h.election) + 18, W - 140)} y={P.t + 33} className="fill-[#f2b705] text-[12px] font-bold">{usd(h.total)} back</text>
          </g>
        )}
      </svg>
      <figcaption className="mt-2 text-xs text-muted-foreground">Money back this year at each Dependent Care FSA election Genora tested. Hover or drag to read any point.</figcaption>
    </figure>
  );
}
