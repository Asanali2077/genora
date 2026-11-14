import type { Assignment } from "@/lib/engine/coverage";

const COLORS: Record<Assignment["cover"], string> = {
  pto: "bg-brand",
  camp: "bg-sun",
  sitter: "bg-sky-strong",
};
const LEGEND: { cover: Assignment["cover"]; label: string }[] = [
  { cover: "pto", label: "Parent PTO" },
  { cover: "camp", label: "Day camp" },
  { cover: "sitter", label: "Sitter" },
];

/** One row per month, one cell per day: the family's year at a glance. */
export function YearStrip({ assignments, from, months = 10 }: { assignments: Assignment[]; from: string; months?: number }) {
  const byDate = new Map(assignments.map((a) => [a.date, a]));
  const start = new Date(Date.UTC(+from.slice(0, 4), +from.slice(5, 7) - 1, 1));
  const rows = Array.from({ length: months }, (_, i) => {
    const m = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + i, 1));
    const days = new Date(Date.UTC(m.getUTCFullYear(), m.getUTCMonth() + 1, 0)).getUTCDate();
    return { key: m.toISOString().slice(0, 7), label: m.toLocaleString("en-US", { month: "short", timeZone: "UTC" }), m, days };
  });

  return (
    <figure>
      <div className="space-y-1.5" role="img" aria-label="School-break coverage by month">
        {rows.map((r) => (
          <div key={r.key} className="grid grid-cols-[2.5rem_1fr] items-center gap-2">
            <span className="text-xs text-muted-foreground">{r.label}</span>
            <div className="grid gap-[2px]" style={{ gridTemplateColumns: "repeat(31, minmax(0, 1fr))" }}>
              {Array.from({ length: r.days }, (_, d) => {
                const iso = `${r.key}-${String(d + 1).padStart(2, "0")}`;
                const a = byDate.get(iso);
                const weekend = [0, 6].includes(new Date(`${iso}T00:00:00Z`).getUTCDay());
                return (
                  <span
                    key={iso}
                    title={a ? `${iso}: ${a.label} — ${a.cover === "pto" ? `${a.who} PTO` : a.cover}` : iso}
                    className={`aspect-square rounded-[2px] ${a ? COLORS[a.cover] : weekend ? "bg-transparent" : "bg-border/70"}`}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <figcaption className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
        {LEGEND.map((l) => (
          <span key={l.cover} className="inline-flex items-center gap-1.5">
            <span className={`size-3 rounded-[2px] ${COLORS[l.cover]}`} aria-hidden />
            {l.label}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5">
          <span className="size-3 rounded-[2px] bg-border/70" aria-hidden />
          School day
        </span>
      </figcaption>
    </figure>
  );
}
