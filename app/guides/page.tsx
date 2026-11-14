import Link from "next/link";
import type { Metadata } from "next";
import { Clock } from "lucide-react";
import { guides } from "@/config/guides";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Childcare money guides for 2026 — Genora",
  description: "Dependent Care FSA vs the childcare tax credit, eligible care, the $7,500 household limit and FSA deadlines, explained with the 2026 rules.",
};

export default function GuidesPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-20 pt-10 md:pt-16">
      <h1 className="max-w-3xl font-heading text-[2.4rem] font-bold leading-[1.05] tracking-[-0.03em] text-ink sm:text-5xl">The 2026 childcare money rules, in plain English</h1>
      <p className="mt-4 max-w-2xl text-lg text-muted-foreground">Four short guides written from the tax code. Read one, then let Genora run the numbers for your family.</p>

      <nav aria-label="Guides" className="mt-10 grid gap-3 sm:grid-cols-2">
        {guides.map((g) => (
          <a key={g.slug} href={`#${g.slug}`} className="panel block p-5 transition-[box-shadow,transform] hover:-translate-y-0.5">
            <p className="font-heading text-lg font-bold leading-snug text-ink">{g.title}</p>
            <p className="mt-2 text-sm text-muted-foreground">{g.summary}</p>
            <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-brand"><Clock className="size-3.5" aria-hidden />{g.minutes} min read</p>
          </a>
        ))}
      </nav>

      <div className="mt-16 space-y-16">
        {guides.map((g) => (
          <article key={g.slug} id={g.slug} className="scroll-mt-24 border-t border-ink/[0.08] pt-10 lg:grid lg:grid-cols-[15rem_1fr] lg:gap-12">
            <div>
              <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand"><Clock className="size-4" aria-hidden />{g.minutes} min read</p>
            </div>
            <div className="max-w-2xl">
              <h2 className="font-heading text-3xl font-bold leading-tight tracking-[-0.02em] text-ink">{g.title}</h2>
              {g.sections.map((s) => (
                <section key={s.heading} className="mt-7">
                  <h3 className="text-lg font-semibold text-ink">{s.heading}</h3>
                  {s.body.map((p) => <p key={p} className="mt-3 text-[17px] leading-relaxed text-ink/80">{p}</p>)}
                </section>
              ))}
              <p className="mt-7 text-sm text-muted-foreground">
                Sources:{" "}
                {g.sources.map((s, i) => (
                  <span key={s.url}>{i > 0 && ", "}<a href={s.url} target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-brand">{s.label}</a></span>
                ))}
              </p>
              <Button className="mt-6" nativeButton={false} render={<Link href="/start" />}>Run my family&apos;s numbers</Button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
