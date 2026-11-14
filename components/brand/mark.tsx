/**
 * The Genora mark: a 2×2 "family grid" — four calendar days, four people. Pine for the parents,
 * marigold for money found, sky for a day without school. The same cell shape is the product's motif.
 */
export function Mark({ size = 26, className }: { size?: number; className?: string }) {
  const c = size / 2 - 1.5;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden className={className}>
      <rect x="0" y="0" width={c} height={c} rx={c * 0.32} fill="var(--pine)" />
      <rect x={c + 3} y="0" width={c} height={c} rx={c * 0.32} fill="var(--pine)" />
      <rect x="0" y={c + 3} width={c} height={c} rx={c * 0.32} fill="var(--marigold)" />
      <rect x={c + 3} y={c + 3} width={c} height={c} rx={c * 0.32} fill="#9cc3e6" />
    </svg>
  );
}

export function Wordmark() {
  return (
    <span className="inline-flex items-center gap-2.5">
      <Mark />
      <span className="font-heading text-[22px] font-extrabold tracking-[-0.03em] text-ink">genora</span>
    </span>
  );
}
