"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import { motion, useMotionValue, useSpring } from "framer-motion";

/** Smooth, weighted scrolling on marketing pages (off inside the app and for reduced motion). */
export function SmoothScroll() {
  const path = usePathname();
  useEffect(() => {
    if (path.startsWith("/app") || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    let raf = 0;
    const loop = (t: number) => {
      lenis.raf(t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
    };
  }, [path]);
  return null;
}

/** A warm light that follows the cursor across a dark section, plus film grain for a printed feel. */
export function Spotlight() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current?.parentElement;
    if (!el) return;
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      ref.current!.style.setProperty("--x", `${e.clientX - r.left}px`);
      ref.current!.style.setProperty("--y", `${e.clientY - r.top}px`);
    };
    el.addEventListener("pointermove", move);
    return () => el.removeEventListener("pointermove", move);
  }, []);
  return (
    <>
      <div
        ref={ref}
        aria-hidden
        className="pointer-events-none absolute inset-0 transition-opacity duration-500"
        style={{ background: "radial-gradient(560px circle at var(--x, 30%) var(--y, 40%), rgba(255,200,61,0.13), transparent 62%)" }}
      />
      <div aria-hidden className="grain pointer-events-none absolute inset-0 opacity-[0.07] mix-blend-overlay" />
    </>
  );
}

/** Pulls gently toward the cursor — a small reward for reaching for the main action. */
export function Magnetic({ children, strength = 0.25 }: { children: React.ReactNode; strength?: number }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 16 });
  const sy = useSpring(y, { stiffness: 220, damping: 16 });
  return (
    <motion.div
      className="inline-block"
      style={{ x: sx, y: sy }}
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        x.set((e.clientX - r.left - r.width / 2) * strength);
        y.set((e.clientY - r.top - r.height / 2) * strength);
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.div>
  );
}

const FACTS = [
  "Only about 5% of eligible employees use a Dependent Care FSA",
  "$7,500 — the new 2026 household FSA limit, first raise since 1986",
  "Schools close ~29 days a year; a typical worker gets ~16 days of paid leave",
  "$13,184 — average yearly price of childcare per child (2025)",
  "Day camp counts for the FSA. Overnight camp doesn't.",
  "FSA money left unclaimed is forfeited — there is no carryover",
];

/** A slow ticker of sourced facts between the hero and the story. Pauses on hover. */
export function FactTicker() {
  const items = [...FACTS, ...FACTS];
  return (
    <div className="group relative overflow-hidden border-y border-white/10 bg-brand-deep py-4 text-white" aria-label="Facts">
      <div className="flex w-max animate-[ticker_48s_linear_infinite] gap-10 group-hover:[animation-play-state:paused] motion-reduce:animate-none">
        {items.map((f, i) => (
          <span key={i} className="inline-flex items-center gap-10 whitespace-nowrap text-sm text-white/75" aria-hidden={i >= FACTS.length}>
            {f}
            <span className="grid grid-cols-2 gap-[3px]" aria-hidden>
              <span className="size-[5px] rounded-[1.5px] bg-white/70" />
              <span className="size-[5px] rounded-[1.5px] bg-white/70" />
              <span className="size-[5px] rounded-[1.5px] bg-sun" />
              <span className="size-[5px] rounded-[1.5px] bg-sky" />
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
