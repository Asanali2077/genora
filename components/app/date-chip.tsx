/** A tear-off calendar page: the product's date vernacular. */
export function DateChip({ iso, tone = "pine" }: { iso: string; tone?: "pine" | "marigold" | "sky" }) {
  const d = new Date(`${iso}T00:00:00Z`);
  const month = d.toLocaleString("en-US", { month: "short", timeZone: "UTC" });
  const top = tone === "pine" ? "bg-pine text-white" : tone === "marigold" ? "bg-marigold text-ink" : "bg-[#5b8fc7] text-white";
  return (
    <span className="flex w-12 shrink-0 flex-col overflow-hidden rounded-[10px] border border-ink/10 bg-white text-center shadow-[0_1px_2px_rgba(23,42,38,0.08)]" aria-hidden>
      <span className={`py-0.5 text-[11px] font-semibold ${top}`}>{month}</span>
      <span className="py-1 font-heading text-xl font-bold leading-none text-ink tabular">{d.getUTCDate()}</span>
    </span>
  );
}
