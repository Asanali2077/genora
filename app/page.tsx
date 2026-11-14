import Link from "next/link";
import { Lock, Timer, FileCheck } from "lucide-react";
import { landing } from "@/config/site";
import { LiveCalculator } from "@/components/landing/live-calculator";
import { ClaimsFragment, CompareFragment, YearFragment } from "@/components/landing/fragments";
import { Button } from "@/components/ui/button";
import { TrackView } from "@/components/track-view";

const FRAGMENTS = [CompareFragment, YearFragment, ClaimsFragment];
const TRUST = [
  { icon: Timer, text: "3 minutes, 11 questions" },
  { icon: Lock, text: "No bank login, no SSN" },
  { icon: FileCheck, text: "Every number shows its IRS rule" },
];

export default function Home() {
  return (
    <>
      <TrackView name="landing_view" />
      <section className="mx-auto grid w-full max-w-5xl gap-10 px-4 pb-16 pt-10 md:grid-cols-[1.3fr_1fr] md:items-center md:gap-12 md:pt-20">
        <div>
          <h1 className="text-[2.35rem] font-extrabold leading-[1.04] text-ink sm:text-[3.15rem]">{landing.heroTitle}</h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">{landing.heroSub}</p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button size="lg" nativeButton={false} render={<Link href="/start" />}>{landing.cta}</Button>
            <Button size="lg" variant="ghost" nativeButton={false} render={<Link href="#how" />}>How it works</Button>
          </div>
          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
            {TRUST.map(({ icon: Icon, text }) => (
              <li key={text} className="inline-flex items-center gap-2"><Icon className="size-4 text-pine" aria-hidden />{text}</li>
            ))}
          </ul>
        </div>
        <LiveCalculator />
      </section>

      <section id="how" className="border-t border-ink/[0.07] bg-white/60">
        <div className="mx-auto max-w-5xl space-y-16 px-4 py-16 md:space-y-24 md:py-24">
          {landing.pillars.map((p, i) => {
            const Fragment = FRAGMENTS[i];
            return (
              <div key={p.title} className="grid items-center gap-8 md:grid-cols-2 md:gap-16">
                <div className={i % 2 ? "md:order-2" : ""}>
                  <h2 className="text-3xl font-extrabold leading-tight text-ink">{p.title}</h2>
                  <p className="mt-3 max-w-md text-lg leading-relaxed text-muted-foreground">{p.body}</p>
                </div>
                <div className={i % 2 ? "md:order-1" : ""}><Fragment /></div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-4 py-16 md:py-20">
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
