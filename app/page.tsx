import Link from "next/link";
import { landing } from "@/config/site";
import { LiveCalculator } from "@/components/landing/live-calculator";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <>
      <section className="mx-auto grid w-full max-w-5xl gap-10 px-4 pb-16 pt-10 md:grid-cols-[1.1fr_1fr] md:items-center md:pt-16">
        <div>
          <h1 className="text-4xl font-extrabold leading-[1.05] sm:text-5xl">{landing.heroTitle}</h1>
          <p className="mt-5 max-w-xl text-lg text-muted-foreground">{landing.heroSub}</p>
          <Button size="lg" className="tap mt-7 h-12 rounded-lg px-6 text-base" nativeButton={false} render={<Link href="/start" />}>
            {landing.cta}
          </Button>
        </div>
        <LiveCalculator />
      </section>

      <section className="border-y bg-card">
        <div className="mx-auto grid max-w-5xl gap-8 px-4 py-12 md:grid-cols-3">
          {landing.pillars.map((p) => (
            <div key={p.title}>
              <h2 className="text-xl font-bold text-pine">{p.title}</h2>
              <p className="mt-2 text-muted-foreground">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-4 py-14">
        <dl className="grid gap-8 sm:grid-cols-3">
          {landing.proof.map((p) => (
            <div key={p.stat} className="border-l-4 border-marigold pl-4">
              <dt className="text-sm text-muted-foreground">{p.label}</dt>
              <dd className="mt-1 font-heading text-3xl font-extrabold tabular">{p.stat}</dd>
              <dd className="mt-1 text-xs text-muted-foreground">{p.source}</dd>
            </div>
          ))}
        </dl>
        <Button size="lg" className="tap mt-12 h-12 rounded-lg px-6 text-base" nativeButton={false} render={<Link href="/start" />}>
          {landing.cta}
        </Button>
      </section>
    </>
  );
}
