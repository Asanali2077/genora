import Link from "next/link";
import { Lock, Timer, FileCheck } from "lucide-react";
import { compare, faq, landing } from "@/config/site";
import { LiveCalculator } from "@/components/landing/live-calculator";
import { HeroGrid } from "@/components/landing/hero-grid";
import { SampleButton } from "@/components/landing/sample-button";
import { Reveal } from "@/components/motion";
import { FactTicker, Magnetic, Spotlight } from "@/components/landing/effects";
import { Story } from "@/components/landing/story";
import { Bento } from "@/components/landing/bento";
import { Button } from "@/components/ui/button";
import { TrackView } from "@/components/track-view";

const TRUST = [
  { icon: Timer, text: "3 minutes, 11 questions" },
  { icon: Lock, text: "No bank login, no SSN" },
  { icon: FileCheck, text: "Every number shows its IRS rule" },
];

export default function Home() {
  return (
    <>
      <TrackView name="landing_view" />
      <section className="relative overflow-hidden bg-[#0b3b32] text-white">
        <HeroGrid />
        <Spotlight />
        <div className="relative mx-auto grid w-full max-w-6xl gap-12 px-4 pb-20 pt-12 md:grid-cols-[1.25fr_1fr] md:items-center md:gap-14 md:pb-24 md:pt-20">
          <Reveal y={24}>
            <h1 className="font-heading text-[2.5rem] font-bold leading-[1.02] tracking-[-0.035em] sm:text-[3.6rem]">{landing.heroTitle}</h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/75">{landing.heroSub}</p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Magnetic><Button size="lg" className="shine bg-marigold text-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_8px_24px_-10px_rgba(242,183,5,0.7)] hover:bg-[#ffc61a]" nativeButton={false} render={<Link href="/start" />}>
                {landing.cta}
              </Button></Magnetic>
              <SampleButton dark />
            </div>
            <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/65">
              {TRUST.map(({ icon: Icon, text }) => (
                <li key={text} className="inline-flex items-center gap-2"><Icon className="size-4 text-marigold" aria-hidden />{text}</li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={0.15} y={32}><LiveCalculator /></Reveal>
        </div>
      </section>
      <FactTicker />

      <Story />
      <Bento />

      <section aria-labelledby="compare" className="mx-auto w-full max-w-5xl px-4 pb-4">
        <h2 id="compare" className="font-heading text-3xl font-bold tracking-[-0.02em] text-ink">{compare.title}</h2>
        <div className="panel mt-6 overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-ink/[0.07] text-left">
                <th scope="col" className="p-4 font-medium text-muted-foreground" />
                {compare.columns.map((c, i) => (
                  <th key={c} scope="col" className={i === 0 ? "bg-pine/[0.07] p-4 font-heading text-base font-bold text-pine" : "p-4 font-medium text-muted-foreground"}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {compare.rows.map((r) => (
                <tr key={r.label} className="border-b border-ink/[0.06] last:border-0">
                  <th scope="row" className="p-4 text-left font-semibold text-ink">{r.label}</th>
                  {r.values.map((v, i) => (
                    <td key={i} className={i === 0 ? "bg-pine/[0.07] p-4 font-semibold text-pine" : "p-4 text-muted-foreground"}>{v}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="faq" className="mx-auto grid w-full max-w-5xl gap-8 px-4 py-16 md:grid-cols-[18rem_1fr] md:py-20">
        <div>
          <h2 id="faq" className="font-heading text-3xl font-bold tracking-[-0.02em] text-ink">Questions parents ask</h2>
          <p className="mt-3 text-muted-foreground">More detail in the <Link href="/guides" className="font-semibold text-pine underline-offset-2 hover:underline">2026 rules guides</Link>.</p>
        </div>
        <div className="panel ledger">
          {faq.map((f) => (
            <details key={f.q} className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-semibold text-ink sm:px-6">
                {f.q}
                <span aria-hidden className="text-xl leading-none text-pine transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="px-5 pb-5 text-[15px] leading-relaxed text-muted-foreground sm:px-6">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
      <section className="mx-auto w-full max-w-5xl px-4 pb-16 md:pb-20">
        <dl className="grid gap-10 sm:grid-cols-3">
          {landing.proof.map((p) => (
            <div key={p.stat}>
              <dd className="font-heading text-4xl font-extrabold tracking-tight text-ink tabular">{p.stat}</dd>
              <dt className="mt-2 text-[15px] leading-snug text-ink/80">{p.label}</dt>
              <dd className="mt-1.5 text-xs text-muted-foreground">{p.source}</dd>
            </div>
          ))}
        </dl>
        <div className="panel mt-16 flex flex-col items-start gap-5 p-7 sm:flex-row sm:items-center sm:justify-between sm:p-9">
          <div>
            <h2 className="text-2xl font-extrabold text-ink sm:text-3xl">See your family&apos;s number in 3 minutes.</h2>
            <p className="mt-2 text-muted-foreground">Free to check. You only pay if you want the full plan.</p>
          </div>
          <Button size="lg" nativeButton={false} render={<Link href="/start" />}>{landing.cta}</Button>
        </div>
      </section>
    </>
  );
}
