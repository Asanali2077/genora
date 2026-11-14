"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/** Sticky in-page tabs for long screens: shows where you are and jumps to any part. */
export function SectionTabs({ sections }: { sections: { id: string; label: string }[] }) {
  const [active, setActive] = useState(sections[0]?.id);

  useEffect(() => {
    const els = sections.map((s) => document.getElementById(s.id)).filter((e): e is HTMLElement => !!e);
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-120px 0px -60% 0px" },
    );
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, [sections]);

  return (
    <nav aria-label="On this page" className="sticky top-14 z-20 -mx-5 border-b border-ink/[0.07] bg-paper/90 px-5 backdrop-blur md:top-0 md:-mx-10 md:px-10">
      <ul className="flex gap-1 overflow-x-auto py-2 [scrollbar-width:none]">
        {sections.map((s) => (
          <li key={s.id} className="shrink-0">
            <a
              href={`#${s.id}`}
              aria-current={active === s.id ? "location" : undefined}
              onClick={() => setActive(s.id)}
              className={cn("relative flex h-9 items-center rounded-full px-3.5 text-sm font-semibold transition-colors", active === s.id ? "text-brand" : "text-ink/55 hover:text-ink")}
            >
              {active === s.id && <motion.span layoutId="section-tab" className="absolute inset-0 rounded-full bg-brand/[0.09]" transition={{ type: "spring", stiffness: 500, damping: 40 }} />}
              <span className="relative">{s.label}</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
