"use client";

import { motion } from "framer-motion";
import type { Month } from "@/lib/engine/budget";

const W = 760;
const H = 300;
const P = { l: 56, r: 16, top: 16 };
const LINE_BOTTOM = 170;
const BAR_MID = 232;
const BAR_MAX = 44;
const ease = [0.22, 1, 0.36, 1] as const;
const k = (n: number) => `${n < 0 ? "−" : ""}$${Math.abs(n) >= 1000 ? `${(Math.abs(n) / 1000).toFixed(Math.abs(n) >= 10_000 ? 0 : 1)}k` : Math.abs(Math.round(n))}`;

/**
 * Twelve months at a glance: the cash balance as a line (top) and each month's surplus or shortfall as bars (bottom).
 * Months that dip below zero are marked; click or focus a month to open its breakdown.
 */
export function ForecastChart({ months, selected, onSelect }: { months: Month[]; selected: number; onSelect: (i: number) => void }) {
  const balances = months.map((m) => m.balance);
  const lo = Math.min(0, ...balances);
  const hi = Math.max(1, ...balances);
  const col = (W - P.l - P.r) / months.length;
  const x = (i: number) => P.l + col * (i + 0.5);
  const y = (v: number) => LINE_BOTTOM - ((v - lo) / (hi - lo)) * (LINE_BOTTOM - P.top);
  const maxNet = Math.max(1, ...months.map((m) => Math.abs(m.net)));
  const path = months.map((m, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(m.balance).toFixed(1)}`).join(" ");
  const area = `${path} L${x(months.length - 1)},${y(lo)} L${x(0)},${y(lo)} Z`;

  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full select-none" role="img" aria-label="Cash balance and monthly surplus for the next 12 months">
        <defs>
          <linearGradient id="bal-area" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--pine)" stopOpacity="0.2" />
            <stop offset="100%" stopColor="var(--pine)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* selected month band */}
        <motion.rect animate={{ x: x(selected) - col / 2 }} transition={{ type: "spring", stiffness: 320, damping: 30 }} y={0} width={col} height={H - 22} rx={10} fill="rgb(15 92 77 / 0.07)" />

        {[hi, (hi + lo) / 2, lo].map((v, i) => (
          <g key={i}>
            <line x1={P.l} x2={W - P.r} y1={y(v)} y2={y(v)} stroke="rgb(23 42 38 / 0.07)" />
            <text x={P.l - 8} y={y(v) + 4} textAnchor="end" className="fill-[#4f625d] text-[11px]">{k(v)}</text>
          </g>
        ))}
        {lo < 0 && <line x1={P.l} x2={W - P.r} y1={y(0)} y2={y(0)} stroke="var(--destructive)" strokeDasharray="4 4" opacity={0.6} />}

        <motion.path d={area} fill="url(#bal-area)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 0.6 }} />
        <motion.path d={path} fill="none" stroke="var(--pine)" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.1, ease }} />
        {months.map((m, i) => (
          <motion.circle key={m.ym} cx={x(i)} cy={y(m.balance)} r={i === selected ? 6 : 3.5} fill={m.balance < 0 ? "var(--destructive)" : i === selected ? "var(--marigold)" : "var(--pine)"} stroke="#fff" strokeWidth={2} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.6 + i * 0.04 }} />
        ))}

        {/* monthly surplus / shortfall */}
        <line x1={P.l} x2={W - P.r} y1={BAR_MID} y2={BAR_MID} stroke="rgb(23 42 38 / 0.15)" />
        <text x={P.l - 8} y={BAR_MID + 4} textAnchor="end" className="fill-[#4f625d] text-[11px]">net</text>
        {months.map((m, i) => {
          const h = (Math.abs(m.net) / maxNet) * BAR_MAX;
          return (
            <motion.rect
              key={m.ym}
              x={x(i) - col * 0.28}
              width={col * 0.56}
              rx={4}
              fill={m.net >= 0 ? "var(--pine)" : "#d9694f"}
              initial={{ height: 0, y: BAR_MID }}
              animate={{ height: h, y: m.net >= 0 ? BAR_MID - h : BAR_MID }}
              transition={{ delay: 0.2 + i * 0.04, duration: 0.5, ease }}
            />
          );
        })}

        {months.map((m, i) => (
          <g key={m.ym}>
            <text x={x(i)} y={H - 6} textAnchor="middle" className={`text-[11px] ${i === selected ? "fill-[#172a26] font-bold" : "fill-[#4f625d]"}`}>{m.label.slice(0, 3)}</text>
            <rect x={x(i) - col / 2} y={0} width={col} height={H} fill="transparent" className="cursor-pointer" onClick={() => onSelect(i)} onPointerEnter={(e) => e.pointerType === "mouse" && onSelect(i)} />
          </g>
        ))}
      </svg>
      <figcaption className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5"><span className="h-0.5 w-4 rounded bg-pine" />Cash balance</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-[3px] bg-pine" />Month ends ahead</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-[3px] bg-[#d9694f]" />Month ends behind</span>
      </figcaption>
      <div className="sr-only">
        {months.map((m, i) => (
          <button key={m.ym} type="button" onClick={() => onSelect(i)}>{m.label}: balance {m.balance}, net {Math.round(m.net)}</button>
        ))}
      </div>
    </figure>
  );
}
