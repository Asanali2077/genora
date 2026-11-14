"use client";

import { motion } from "framer-motion";
import { Share2 } from "lucide-react";
import type { Savings } from "@/lib/engine/family";
import { CountUp } from "@/components/motion";
import { track } from "@/lib/analytics";
import { Button } from "@/components/ui/button";

const usd = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
const TONES = ["bg-pine", "bg-marigold", "bg-[#5b8fc7]", "bg-[#f3c9b6]"];

/** The subscription's proof: everything Genora found this year, with the return on the plan price. */
export function SavingsHero({ savings, price }: { savings: Savings; price: number }) {
  const max = Math.max(1, savings.total);
  async function share() {
    const url = `${window.location.origin}/api/card?found=${savings.total}`;
    track("savings_card_shared");
    try {
      if (navigator.share) await navigator.share({ title: "Genora", text: `Our family found ${usd(savings.total)} a year in childcare money with Genora.`, url: window.location.origin });
      else window.open(url, "_blank");
    } catch {}
  }
  return (
    <section aria-labelledby="found" className="relative overflow-hidden rounded-[22px] bg-[#0b3b32] p-6 text-white sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 id="found" className="text-sm font-semibold text-white/70">Genora found your family this year</h2>
          <p className="mt-1 font-heading text-5xl font-bold tracking-[-0.03em] text-marigold sm:text-6xl"><CountUp value={savings.total} /></p>
          <p className="mt-2 text-white/75">{savings.roi >= 1 ? `${savings.roi}× what the ${usd(price)} plan costs.` : "Add your school calendar and benefits guide to find more."}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-white/20 bg-white/10 text-white hover:border-white/50 hover:text-white" onClick={share}><Share2 />Share</Button>
          <Button variant="ghost" className="text-white/80 hover:bg-white/10 hover:text-white" nativeButton={false} render={<a href={`/api/card?found=${savings.total}`} target="_blank" rel="noreferrer" />}>Card</Button>
        </div>
      </div>
      <div className="mt-6 flex h-3 overflow-hidden rounded-full bg-white/10">
        {savings.parts.map((p, i) => (
          <motion.div key={p.label} className={TONES[i % TONES.length]} initial={{ width: 0 }} animate={{ width: `${(p.amount / max) * 100}%` }} transition={{ delay: 0.3 + i * 0.2, duration: 0.7, ease: [0.22, 1, 0.36, 1] }} />
        ))}
      </div>
      <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
        {savings.parts.map((p, i) => (
          <li key={p.label} className="inline-flex items-center gap-2 text-white/80">
            <span className={`size-2.5 rounded-full ${TONES[i % TONES.length]}`} aria-hidden />
            {p.label} <span className="font-semibold text-white tabular">{usd(p.amount)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
