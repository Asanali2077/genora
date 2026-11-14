"use client";

import { useEffect, useRef, useState } from "react";
import { MotionConfig, motion, useInView, type Variants } from "framer-motion";

/** Respects the OS "reduce motion" setting everywhere. */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

const ease = [0.22, 1, 0.36, 1] as const;

/** Fades and lifts content into view once, when it scrolls into the viewport. */
export function Reveal({ children, delay = 0, className, y = 18 }: { children: React.ReactNode; delay?: number; className?: string; y?: number }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay, ease }}
    >
      {children}
    </motion.div>
  );
}

const container: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } } };
const item: Variants = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.45, ease } } };

/** Staggers its direct <StaggerItem> children in sequence. */
export function Stagger({ children, className, as = "div" }: { children: React.ReactNode; className?: string; as?: "div" | "ol" | "ul" }) {
  const Tag = motion[as];
  return (
    <Tag className={className} variants={container} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-40px" }}>
      {children}
    </Tag>
  );
}
export function StaggerItem({ children, className, as = "div" }: { children: React.ReactNode; className?: string; as?: "div" | "li" }) {
  const Tag = motion[as];
  return (
    <Tag className={className} variants={item}>
      {children}
    </Tag>
  );
}

/** Counts from 0 to `value` when it first appears on screen. */
export function CountUp({ value, prefix = "$", duration = 1.1, className }: { value: number; prefix?: string; duration?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!inView) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const id = requestAnimationFrame(() => setN(value));
      return () => cancelAnimationFrame(id);
    }
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const k = Math.min(1, (t - start) / (duration * 1000));
      setN(value * (1 - Math.pow(1 - k, 3)));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value, duration]);
  return <span ref={ref} className={className}>{prefix}{Math.round(n).toLocaleString("en-US")}</span>;
}

/** A bar that grows to its width when it scrolls into view. */
export function GrowBar({ pct, className, delay = 0 }: { pct: number; className?: string; delay?: number }) {
  return (
    <motion.div
      className={className}
      initial={{ width: 0 }}
      whileInView={{ width: `${pct}%` }}
      viewport={{ once: true }}
      transition={{ duration: 0.9, delay, ease }}
    />
  );
}
