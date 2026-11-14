"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll, useTransform } from "framer-motion";
import { Check, LifeBuoy } from "lucide-react";
import { ClaimsFragment } from "./fragments";

const ease = [0.22, 1, 0.36, 1] as const;

const STEPS = [
  { kicker: "3 minutes", title: "Tell Genora about your family", body: "Pay, kids, childcare costs and what each employer offers. No bank login, no SSN." },
  { kicker: "Instant", title: "See the money you're missing", body: "A 12-month forecast with 2026 tax rules, benefits and credits built in — and the money you're leaving on the table, with the rule behind each number." },
  { kicker: "All year", title: "Plan every day without school", body: "Paste the district calendar. PTO goes to the most expensive days, FSA-eligible camps cover the rest." },
  { kicker: "Every week", title: "Never lose a dollar or a workday", body: "Snap receipts before money is forfeited, and when a kid gets sick, get the cheapest way to cover it in seconds." },
];

function ScreenQuestions() {
  const opts = ["Married, filing jointly", "Single parent", "Single"];
  return (
    <div className="p-5">
      <div className="flex gap-1">{[0, 1, 2, 3, 4, 5, 6].map((i) => <span key={i} className={`h-1 flex-1 rounded-full ${i < 2 ? "bg-brand" : "bg-ink/10"}`} />)}</div>
      <p className="mt-6 font-heading text-xl font-bold leading-tight text-ink">Who files taxes in your home?</p>
      <div className="mt-4 space-y-2.5">
        {opts.map((o, i) => (
          <motion.div key={o} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.1, ease }} className={`flex items-center justify-between rounded-[12px] border px-3.5 py-3 text-sm font-semibold ${i === 0 ? "border-brand bg-wash text-ink" : "border-ink/12 bg-white text-ink"}`}>
            {o}
            <span className={`flex size-5 items-center justify-center rounded-full border-2 ${i === 0 ? "border-brand bg-brand text-white" : "border-ink/20"}`}>{i === 0 && <Check className="size-3" strokeWidth={3} />}</span>
          </motion.div>
        ))}
      </div>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="mt-5 text-right text-sm text-muted-foreground">Found so far <span className="marker font-heading font-bold text-ink">$1,724</span></motion.p>
    </div>
  );
}

function ScreenMoney() {
  return (
    <div className="p-5">
      <p className="text-sm text-muted-foreground">Your 2026 childcare money plan</p>
      <p className="mt-2 font-heading text-[1.65rem] font-bold leading-tight text-ink">You&apos;re leaving <span className="marker">$1,724</span> a year on the table.</p>
      <div className="mt-6 space-y-4">
        {[{ l: "Today", v: "$1,050", w: 38, c: "bg-ink/25" }, { l: "With Genora", v: "$2,774", w: 100, c: "bg-brand" }].map((r, i) => (
          <div key={r.l}>
            <div className="flex justify-between text-sm"><span className="text-ink">{r.l}</span><span className="font-heading font-bold text-ink">{r.v}</span></div>
            <div className="mt-1.5 h-2.5 rounded-full bg-wash"><motion.div className={`h-full rounded-full ${r.c}`} initial={{ width: 0 }} animate={{ width: `${r.w}%` }} transition={{ delay: 0.2 + i * 0.25, duration: 0.8, ease }} /></div>
          </div>
        ))}
      </div>
      <div className="mt-6 rounded-[12px] bg-wash p-3.5 text-sm text-ink">Elect <b>$7,500</b> in your Dependent Care FSA at open enrollment.</div>
    </div>
  );
}

function ScreenWeek() {
  return (
    <div className="space-y-4 p-4">
      <ClaimsFragment />
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, ease }} className="flex items-center gap-3 rounded-[16px] bg-sun p-4 text-ink">
        <LifeBuoy className="size-6 shrink-0" />
        <div className="text-sm"><b>Leo is sick tomorrow.</b><span className="block text-ink/75">Best option: Partner takes the day off, $0.</span></div>
      </motion.div>
    </div>
  );
}


// April 2027, weekdays only: spring break Apr 5–9 is covered by one PTO day and four day-camp days.
const APRIL: (number | null)[] = [null, null, null, 1, 2, 5, 6, 7, 8, 9, 12, 13, 14, 15, 16, 19, 20, 21, 22, 23, 26, 27, 28, 29, 30];
function ScreenBreaks() {
  const cover = (d: number | null) => (d === 5 ? "pto" : d !== null && d >= 6 && d <= 9 ? "camp" : null);
  return (
    <div className="p-5">
      <p className="text-sm text-muted-foreground">School breaks · April 2027</p>
      <p className="mt-1 font-heading text-xl font-bold text-ink">Spring break is covered</p>
      <div className="mt-5 grid grid-cols-5 gap-2 text-center text-[11px] font-semibold text-muted-foreground">
        {["M", "T", "W", "T", "F"].map((d, i) => <span key={i}>{d}</span>)}
        {APRIL.map((d, i) => {
          const c = cover(d);
          return (
            <motion.span
              key={i}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: d === null ? 0 : 1, scale: 1 }}
              transition={{ delay: 0.05 + i * 0.025, type: "spring", stiffness: 300, damping: 20 }}
              className={`flex aspect-square items-center justify-center rounded-[8px] text-xs font-bold ${c === "pto" ? "bg-brand text-white" : c === "camp" ? "bg-sun text-ink" : "bg-ink/[0.06] text-ink/60"}`}
            >
              {d}
            </motion.span>
          );
        })}
      </div>
      <div className="mt-5 space-y-2 text-sm">
        <p className="flex items-center justify-between"><span className="inline-flex items-center gap-2 text-ink"><span className="size-2.5 rounded-[3px] bg-brand" />Partner&apos;s PTO</span><b className="text-ink">1 day</b></p>
        <p className="flex items-center justify-between"><span className="inline-flex items-center gap-2 text-ink"><span className="size-2.5 rounded-[3px] bg-sun" />Day camp · FSA-eligible</span><b className="text-ink">$480</b></p>
        <p className="flex items-center justify-between text-muted-foreground"><span>Tax saved through the FSA</span><b className="text-brand">−$144</b></p>
      </div>
    </div>
  );
}

const SCREENS = [ScreenQuestions, ScreenMoney, ScreenBreaks, ScreenWeek];

function Phone({ step }: { step: number }) {
  const Screen = SCREENS[step];
  return (
    <div className="relative mx-auto h-[600px] w-[300px] rounded-[44px] border-[10px] border-brand-deep bg-paper shadow-[0_40px_80px_-30px_rgba(34,24,90,0.6)]">
      <div className="absolute left-1/2 top-2 h-5 w-24 -translate-x-1/2 rounded-full bg-brand-deep" aria-hidden />
      <div className="h-full overflow-hidden rounded-[34px] pt-8">
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, y: 24, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -18, scale: 0.98 }} transition={{ duration: 0.45, ease }}>
            <Screen />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

/** A sticky, scroll-driven walkthrough of one year with Genora: the copy advances and the phone shows the real screens. */
export function Story() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const [step, setStep] = useState(0);
  useMotionValueEvent(scrollYProgress, "change", (p) => setStep(Math.min(STEPS.length - 1, Math.floor(p * STEPS.length))));
  const bar = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <section id="how" aria-label="How Genora works">
      {/* Desktop: sticky scroll story */}
      <div ref={ref} className="relative hidden md:block" style={{ height: `${STEPS.length * 85}vh` }}>
        <div className="sticky top-0 flex h-dvh items-center">
          <div className="mx-auto grid w-full max-w-6xl grid-cols-[1fr_auto] items-center gap-16 px-4">
            <div>
              <div className="mb-10 h-1 w-full max-w-md overflow-hidden rounded-full bg-ink/10"><motion.div className="h-full bg-brand" style={{ width: bar }} /></div>
              <ol className="space-y-8">
                {STEPS.map((s, i) => (
                  <motion.li key={s.title} animate={{ opacity: i === step ? 1 : 0.28, x: i === step ? 0 : -6 }} transition={{ duration: 0.4, ease }}>
                    <p className="text-sm font-semibold text-brand">{String(i + 1).padStart(2, "0")} · {s.kicker}</p>
                    <h3 className="mt-1 font-heading text-[2rem] font-bold leading-tight tracking-[-0.02em] text-ink">{s.title}</h3>
                    <AnimatePresence initial={false}>
                      {i === step && (
                        <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.35, ease }} className="max-w-md overflow-hidden pt-2 text-lg leading-relaxed text-muted-foreground">
                          {s.body}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </motion.li>
                ))}
              </ol>
            </div>
            <Phone step={step} />
          </div>
        </div>
      </div>

      {/* Mobile: stacked steps with the same screens */}
      <div className="space-y-14 px-4 py-16 md:hidden">
        {STEPS.map((s, i) => {
          const Screen = SCREENS[i];
          return (
            <motion.div key={s.title} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.5, ease }}>
              <p className="text-sm font-semibold text-brand">{String(i + 1).padStart(2, "0")} · {s.kicker}</p>
              <h3 className="mt-1 font-heading text-2xl font-bold text-ink">{s.title}</h3>
              <p className="mt-2 text-muted-foreground">{s.body}</p>
              <div className="panel mt-5 overflow-hidden"><Screen /></div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
