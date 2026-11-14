"use client";

import { motion } from "framer-motion";
import { FileSearch, MessageCircleQuestion } from "lucide-react";
import { cn } from "@/lib/utils";

/** A card with a soft light that follows the cursor (spotlight card pattern). */
export function SpotlightCard({ className, children, dark = false }: { className?: string; children: React.ReactNode; dark?: boolean }) {
  return (
    <div
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.setProperty("--sx", `${e.clientX - r.left}px`);
        e.currentTarget.style.setProperty("--sy", `${e.clientY - r.top}px`);
      }}
      className={cn(
        "group relative overflow-hidden rounded-[22px] border p-6 transition-transform duration-300 hover:-translate-y-1",
        dark ? "border-white/10 bg-brand-deep text-white" : "border-ink/[0.08] bg-white",
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: `radial-gradient(380px circle at var(--sx) var(--sy), ${dark ? "rgba(255,200,61,0.16)" : "rgba(91,74,230,0.09)"}, transparent 60%)` }}
      />
      <div className="relative h-full">{children}</div>
    </div>
  );
}

const ease = [0.22, 1, 0.36, 1] as const;
const inView = { initial: "hidden", whileInView: "show", viewport: { once: true, margin: "-60px" } } as const;

function Title({ children, sub, dark }: { children: React.ReactNode; sub: string; dark?: boolean }) {
  return (
    <>
      <h3 className={cn("font-heading text-xl font-bold leading-snug tracking-[-0.015em]", dark ? "text-white" : "text-ink")}>{children}</h3>
      <p className={cn("mt-1.5 text-sm leading-relaxed", dark ? "text-white/70" : "text-muted-foreground")}>{sub}</p>
    </>
  );
}

/** "Everything your budget was missing": a bento grid where each tile shows the real mechanic in miniature. */
export function Bento() {
  const months = ["Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"];
  const net = [0.2, -0.35, 0.3, 0.3, 0.35, 1, 0.4, 0.05, -0.6, -0.3, 0.4, 0.4];
  const sick = [0.5, 0.75, 1, 1, 0.75, 0.3, 0, 0, 0, 0, 0.3, 0.4];

  return (
    <section aria-labelledby="bento" className="mx-auto w-full max-w-6xl px-4 pb-20 pt-10 md:pb-28 md:pt-0">
      <h2 id="bento" className="max-w-2xl display text-[2.2rem] leading-[1.05] text-ink sm:text-5xl">Everything your family budget was missing.</h2>
      <p className="mt-4 max-w-xl text-lg text-muted-foreground">Ordinary budgets track what you spent. Genora plans what&apos;s coming, with the rules built in.</p>

      <div className="mt-12 grid auto-rows-[minmax(15rem,auto)] gap-4 md:grid-cols-6">
        {/* 12-month forecast */}
        <SpotlightCard dark className="md:col-span-4 md:row-span-2">
          <Title dark sub="Take-home pay after 2026 taxes, benefits every paycheck, credits in April, every bill and season. Click a month to see why.">A 12-month forecast, not a spending log</Title>
          <motion.div className="mt-8 flex h-44 items-center gap-2" {...inView} variants={{ show: { transition: { staggerChildren: 0.05 } } }}>
            {net.map((v, i) => (
              <div key={months[i]} className="flex h-full flex-1 flex-col items-center">
                <div className="flex h-1/2 w-full items-end">
                  {v > 0 && <motion.div className="w-full rounded-t-[5px] bg-sun" variants={{ hidden: { height: 0 }, show: { height: `${v * 100}%`, transition: { duration: 0.6, ease } } }} />}
                </div>
                <div className="flex h-1/2 w-full items-start border-t border-white/20">
                  {v < 0 && <motion.div className="w-full rounded-b-[5px] bg-bad" variants={{ hidden: { height: 0 }, show: { height: `${-v * 100}%`, transition: { duration: 0.6, ease } } }} />}
                </div>
                <span className="mt-2 text-[10px] text-white/55">{months[i]}</span>
              </div>
            ))}
          </motion.div>
          <p className="mt-6 text-sm text-white/75"><span className="font-semibold text-sun">April:</span> $4,400 Child Tax Credit + care credit. <span className="font-semibold text-bad">July:</span> vacation + overnight camp.</p>
        </SpotlightCard>

        {/* Tax rules */}
        <SpotlightCard className="md:col-span-2">
          <Title sub="The FSA limit rose to $7,500 and the care credit changed. Genora tests every split.">2026 tax rules, built in</Title>
          <div className="mt-6 flex flex-wrap gap-2">
            {["§129 FSA $7,500", "§21 care credit 50→20%", "§24 CTC $2,200", "FICA 7.65%"].map((c, i) => (
              <motion.span key={c} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="rounded-full border border-brand/20 bg-brand/[0.06] px-3 py-1.5 text-xs font-semibold text-brand">{c}</motion.span>
            ))}
          </div>
        </SpotlightCard>

        {/* Sick season */}
        <SpotlightCard className="md:col-span-2">
          <Title sub="Illness rates by each child's age. PTO and backup care cover it first.">Sick season, priced in</Title>
          <div className="mt-6 flex h-16 items-end gap-1" aria-hidden>
            {sick.map((v, i) => (
              <motion.span key={i} className="flex-1 rounded-t-[3px] bg-brand/80" initial={{ height: 0 }} whileInView={{ height: `${Math.max(6, v * 100)}%` }} viewport={{ once: true }} transition={{ delay: i * 0.04, duration: 0.5, ease }} />
            ))}
          </div>
        </SpotlightCard>

        {/* School breaks */}
        <SpotlightCard className="md:col-span-2">
          <Title sub="29 no-school days vs 16 days of PTO. Spare PTO goes to the most expensive days.">Every school break, planned</Title>
          <div className="mt-6 grid grid-cols-10 gap-1.5" aria-hidden>
            {Array.from({ length: 30 }, (_, i) => {
              const c = [3, 4, 5, 6, 7].includes(i) ? "bg-sun" : [15, 22].includes(i) ? "bg-brand" : [26].includes(i) ? "bg-sky-strong" : "bg-ink/[0.07]";
              return <motion.span key={i} className={`aspect-square rounded-[4px] ${c}`} initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.015, type: "spring", stiffness: 300, damping: 20 }} />;
            })}
          </div>
        </SpotlightCard>

        {/* Benefits scanner */}
        <SpotlightCard className="md:col-span-2">
          <div className="flex items-start justify-between gap-3">
            <Title sub="Upload the HR guide. AI finds backup care and FSA contributions; Genora prices them.">Benefits you didn&apos;t know you had</Title>
            <FileSearch className="size-6 shrink-0 text-brand" aria-hidden />
          </div>
          <p className="mt-5 display text-3xl text-ink">+$2,100<span className="ml-1 text-sm font-medium text-muted-foreground">/ year found</span></p>
        </SpotlightCard>

        {/* Ask */}
        <SpotlightCard className="md:col-span-2">
          <div className="flex items-start justify-between gap-3">
            <Title sub="Answers from your own numbers and the 2026 rules — never invented math.">Ask anything</Title>
            <MessageCircleQuestion className="size-6 shrink-0 text-brand" aria-hidden />
          </div>
          <div className="mt-5 space-y-2 text-sm">
            <p className="ml-auto w-fit rounded-[12px] bg-brand px-3 py-2 text-white">Can I pay for summer camp with the FSA?</p>
            <p className="w-fit max-w-[90%] rounded-[12px] bg-wash px-3 py-2 text-ink">Day camp, yes. Overnight camp, no.</p>
          </div>
        </SpotlightCard>
      </div>
    </section>
  );
}
