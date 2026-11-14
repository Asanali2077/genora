/** A tear-off calendar page: the product's date vernacular. */
export function DateChip({ iso, tone = "brand" }: { iso: string; tone?: "brand" | "sun" | "sky" }) {
  const d = new Date(`${iso}T00:00:00Z`);
  const month = d.toLocaleString("en-US", { month: "short", timeZone: "UTC" });
  const top = tone === "brand" ? "bg-brand text-white" : tone === "sun" ? "bg-sun text-ink" : "bg-sky-strong text-white";
  return (
    <span className="flex w-12 shrink-0 flex-col overflow-hidden rounded-[10px] border border-ink/10 bg-white text-center shadow-[0_1px_2px_rgba(23,22,31,0.08)]" aria-hidden>
      <span className={`py-0.5 text-[11px] font-semibold ${top}`}>{month}</span>
      <span className="py-1 font-heading text-xl font-bold leading-none text-ink">{d.getUTCDate()}</span>
    </span>
  );
}
