"use client";

import { motion } from "framer-motion";

/** Share of the FSA election already backed by receipts, as an animated ring. */
export function UsageRing({ used, total }: { used: number; total: number }) {
  const pct = total > 0 ? Math.min(1, used / total) : 0;
  const r = 44;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative size-32 shrink-0" role="img" aria-label={`${Math.round(pct * 100)}% of the FSA election claimed`}>
      <svg viewBox="0 0 110 110" className="size-full -rotate-90">
        <circle cx="55" cy="55" r={r} fill="none" stroke="var(--wash)" strokeWidth="11" />
        <motion.circle
          cx="55"
          cy="55"
          r={r}
          fill="none"
          stroke="var(--brand)"
          strokeWidth="11"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          whileInView={{ strokeDashoffset: c * (1 - pct) }}
          viewport={{ once: true }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-heading text-2xl font-bold text-ink tabular">{Math.round(pct * 100)}%</span>
        <span className="text-[11px] text-muted-foreground">claimed</span>
      </div>
    </div>
  );
}
