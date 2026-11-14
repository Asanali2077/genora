/**
 * The Genora mark: a 2×2 "family grid" — four calendar days, four people. Violet for the parents,
 * sun for money found, sky for a day without school. The same cell shape is the product's motif.
 */
export function Mark({ size = 26, className, light = false }: { size?: number; className?: string; light?: boolean }) {
  const top = light ? "#ffffff" : "var(--brand)";
  const c = size / 2 - 1.5;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden className={className}>
      <rect x="0" y="0" width={c} height={c} rx={c * 0.32} fill={top} />
      <rect x={c + 3} y="0" width={c} height={c} rx={c * 0.32} fill={top} />
      <rect x="0" y={c + 3} width={c} height={c} rx={c * 0.32} fill="var(--sun)" />
      <rect x={c + 3} y={c + 3} width={c} height={c} rx={c * 0.32} fill="var(--sky)" />
    </svg>
  );
}

export function Wordmark({ light = false }: { light?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <Mark light={light} />
      <span className={`font-heading text-[22px] font-bold tracking-[-0.03em] ${light ? "text-white" : "text-ink"}`}>genora</span>
    </span>
  );
}
