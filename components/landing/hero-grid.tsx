"use client";

import { motion } from "framer-motion";

/**
 * The hero backdrop: a wall of calendar days in the brand's cell shape. A few cells light up sun-yellow in a slow
 * wave — money found on ordinary days. Pure decoration (aria-hidden), honours reduced motion via MotionConfig.
 */
const COLS = 22;
const ROWS = 9;
// Deterministic "found money" days so server and client render the same grid.
const LIT = new Set([5, 19, 27, 44, 58, 63, 81, 96, 104, 117, 131, 146, 152, 169, 178, 191]);
const SKY = new Set([12, 33, 70, 88, 125, 160, 185]);

export function HeroGrid() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 hidden w-[62%] overflow-hidden md:block [mask-image:linear-gradient(to_left,black_40%,transparent)]">
      <div className="absolute -right-6 top-6 grid gap-2.5" style={{ gridTemplateColumns: `repeat(${COLS}, 1.6rem)` }}>
        {Array.from({ length: COLS * ROWS }, (_, i) => {
          const lit = LIT.has(i);
          const sky = SKY.has(i);
          return (
            <motion.span
              key={i}
              className={`size-[1.6rem] rounded-[7px] ${lit ? "bg-sun" : sky ? "bg-sky" : "bg-white"}`}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={lit ? { opacity: [0.15, 0.9, 0.15], scale: 1 } : { opacity: sky ? 0.35 : 0.06, scale: 1 }}
              transition={
                lit
                  ? { duration: 3.2, repeat: Infinity, delay: (i % COLS) * 0.12 + Math.floor(i / COLS) * 0.05, ease: "easeInOut" }
                  : { duration: 0.6, delay: (i % COLS) * 0.02 + Math.floor(i / COLS) * 0.03 }
              }
            />
          );
        })}
      </div>
    </div>
  );
}
