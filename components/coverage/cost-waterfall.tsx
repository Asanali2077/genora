"use client";

import { motion } from "framer-motion";
import type { CoverageResult } from "@/lib/engine/coverage";

const usd = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
const ease = [0.22, 1, 0.36, 1] as const;

/** From "pay for every day" down to what the family really pays: each saving drawn as a step. */
export function CostWaterfall({ result }: { result: CoverageResult }) {
  const total = Math.max(1, result.allPaidCost);
  const youPay = Math.max(0, result.cashCost - result.fsaTaxSaved);
  const rows = [
    { label: "Paying for every no-school day", value: result.allPaidCost, start: 0, width: result.allPaidCost, tone: "bg-ink/25", sign: "" },
    { label: "Your spare PTO covers", value: result.savedByPto, start: result.allPaidCost - result.savedByPto, width: result.savedByPto, tone: "bg-brand", sign: "−" },
    { label: "FSA tax savings on paid care", value: result.fsaTaxSaved, start: result.cashCost - result.fsaTaxSaved, width: result.fsaTaxSaved, tone: "bg-sky-strong", sign: "−" },
    { label: "What you actually pay", value: youPay, start: 0, width: youPay, tone: "bg-sun", sign: "" },
  ];

  const counts = { pto: 0, camp: 0, sitter: 0 };
  for (const a of result.assignments) counts[a.cover]++;
  const days = Math.max(1, result.assignments.length);
  const parts = [
    { key: "pto", label: "PTO", n: counts.pto, tone: "bg-brand" },
    { key: "camp", label: "Day camp", n: counts.camp, tone: "bg-sun" },
    { key: "sitter", label: "Sitter", n: counts.sitter, tone: "bg-sky-strong" },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <div className="panel p-5 sm:p-6">
        <h3 className="font-heading text-lg font-bold text-ink">Where the money goes</h3>
        <ol className="mt-5 space-y-4">
          {rows.map((r, i) => (
            <li key={r.label}>
              <div className="flex justify-between gap-3 text-sm">
                <span className={i === 3 ? "font-semibold text-ink" : "text-muted-foreground"}>{r.label}</span>
                <span className={`font-heading font-bold tabular ${i === 3 ? "text-ink" : "text-ink/80"}`}>{r.sign}{usd(r.value)}</span>
              </div>
              <div className="relative mt-1.5 h-3 rounded-full bg-wash">
                <motion.div
                  className={`absolute inset-y-0 rounded-full ${r.tone}`}
                  style={{ left: `${(r.start / total) * 100}%` }}
                  initial={{ width: 0 }}
                  whileInView={{ width: `${(r.width / total) * 100}%` }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.25, duration: 0.7, ease }}
                />
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="panel p-5 sm:p-6">
        <h3 className="font-heading text-lg font-bold text-ink">How {result.gapDays} days are covered</h3>
        <div className="mt-5 flex h-4 overflow-hidden rounded-full bg-wash">
          {parts.map((p, i) => (
            <motion.div
              key={p.key}
              className={p.tone}
              initial={{ width: 0 }}
              whileInView={{ width: `${(p.n / days) * 100}%` }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 + i * 0.2, duration: 0.6, ease }}
            />
          ))}
        </div>
        <ul className="mt-5 space-y-3">
          {parts.map((p) => (
            <li key={p.key} className="flex items-center justify-between text-sm">
              <span className="inline-flex items-center gap-2 text-ink"><span className={`size-3 rounded-[3px] ${p.tone}`} aria-hidden />{p.label}</span>
              <span className="font-heading font-bold text-ink tabular">{p.n} day{p.n === 1 ? "" : "s"}</span>
            </li>
          ))}
        </ul>
        <div className="mt-5 border-t border-ink/[0.07] pt-4 text-sm text-muted-foreground">
          PTO used: {Object.entries(result.ptoUsed).map(([k, v]) => `${k === "You" ? "you" : k} ${v}`).join(", ")}
        </div>
      </div>
    </div>
  );
}
