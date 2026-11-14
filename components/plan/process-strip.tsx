"use client";

import { motion } from "framer-motion";
import { Check, ClipboardList, FileText, Scale, Search, Trophy } from "lucide-react";

const usd = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

/** "How Genora built this plan": the real pipeline, lighting up step by step with this family's numbers. */
export function ProcessStrip({ answers, scenarios, best, letters }: { answers: number; scenarios: number; best: number; letters: number }) {
  const steps = [
    { icon: ClipboardList, title: `${answers} answers`, body: "Pay, kids, care costs, both employers" },
    { icon: Scale, title: "2026 rules", body: "§129 FSA · §21 care credit · §24 CTC · FICA" },
    { icon: Search, title: `${scenarios} scenarios`, body: "Every FSA election in $50 steps" },
    { icon: Trophy, title: `${usd(best)} best`, body: "Highest money back this year" },
    { icon: FileText, title: `${letters} letters`, body: "Ready for HR and providers" },
  ];
  return (
    <ol className="grid gap-3 sm:grid-cols-5" aria-label="How Genora built this plan">
      {steps.map((s, i) => (
        <motion.li
          key={s.title}
          className="relative rounded-[14px] border border-ink/10 bg-white p-4"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.18, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="flex items-center justify-between">
            <span className="flex size-9 items-center justify-center rounded-[10px] bg-brand/[0.08] text-brand"><s.icon className="size-[18px]" aria-hidden /></span>
            <motion.span
              className="flex size-5 items-center justify-center rounded-full bg-brand text-white"
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.18 + 0.3, type: "spring", stiffness: 400, damping: 18 }}
              aria-hidden
            >
              <Check className="size-3" strokeWidth={3} />
            </motion.span>
          </div>
          <p className="mt-3 font-heading font-bold text-ink tabular">{s.title}</p>
          <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{s.body}</p>
          {i < steps.length - 1 && (
            <motion.span
              aria-hidden
              className="absolute -right-3 top-1/2 hidden h-0.5 w-3 origin-left bg-brand/40 sm:block"
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.18 + 0.35, duration: 0.25 }}
            />
          )}
        </motion.li>
      ))}
    </ol>
  );
}
