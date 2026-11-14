/** Small, static product fragments for the landing page: they show the real UI vocabulary, not stock icons. */

export function CompareFragment() {
  const rows = [
    { label: "Tax credit only", value: 1_050, width: 38 },
    { label: "Genora plan: FSA + credit", value: 2_774, width: 100, best: true },
  ];
  return (
    <div className="panel p-5" aria-hidden>
      <p className="text-sm text-muted-foreground">One child in daycare, $140k, California</p>
      <div className="mt-4 space-y-3.5">
        {rows.map((r) => (
          <div key={r.label}>
            <div className="flex justify-between text-sm">
              <span className={r.best ? "font-semibold text-ink" : "text-muted-foreground"}>{r.label}</span>
              <span className="font-heading font-extrabold tabular text-ink">${r.value.toLocaleString("en-US")}</span>
            </div>
            <div className="mt-1.5 h-2.5 rounded-full bg-[#e6eeeb]">
              <div className={`h-full rounded-full ${r.best ? "bg-pine" : "bg-ink/25"}`} style={{ width: `${r.width}%` }} />
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-sm"><span className="marker font-semibold">+$1,724 a year</span> <span className="text-muted-foreground">from one election change</span></p>
    </div>
  );
}

// A sample spring: P = PTO, C = day camp, S = sitter, . = school day, _ = weekend
const SPRING = [
  { m: "Feb", d: "_.....__.....__P....__CCCCC__...." },
  { m: "Mar", d: "_.....__.....__S....__.....__....." },
  { m: "Apr", d: ".__CCCCC__.....__.....__.....__.." },
];
const CELL: Record<string, string> = { P: "bg-pine", C: "bg-marigold", S: "bg-[#5b8fc7]", ".": "bg-ink/10", _: "bg-transparent" };

export function YearFragment() {
  return (
    <div className="panel p-5" aria-hidden>
      <p className="text-sm text-muted-foreground">13 days without school this spring</p>
      <div className="mt-4 space-y-1.5">
        {SPRING.map((r) => (
          <div key={r.m} className="grid grid-cols-[2.2rem_1fr] items-center gap-2">
            <span className="text-xs text-muted-foreground">{r.m}</span>
            <div className="grid gap-[3px]" style={{ gridTemplateColumns: "repeat(33, minmax(0, 1fr))" }}>
              {r.d.split("").map((c, i) => <span key={i} className={`aspect-square rounded-[3px] ${CELL[c]}`} />)}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-[3px] bg-pine" />PTO</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-[3px] bg-marigold" />Day camp</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-[3px] bg-[#5b8fc7]" />Sitter</span>
      </div>
    </div>
  );
}

export function ClaimsFragment() {
  return (
    <div className="panel p-5" aria-hidden>
      <div className="flex items-baseline justify-between">
        <p className="text-sm text-muted-foreground">FSA election $5,000</p>
        <p className="text-sm font-semibold text-destructive">$785 at risk</p>
      </div>
      <div className="mt-4 flex h-3.5 overflow-hidden rounded-full bg-[#e6eeeb]">
        <span className="bg-pine" style={{ width: "33%" }} />
        <span className="bg-marigold" style={{ width: "18%" }} />
        <span style={{ width: "33%", backgroundImage: "repeating-linear-gradient(45deg, var(--pine) 0 2px, transparent 2px 7px)", opacity: 0.35 }} />
        <span className="bg-destructive/15" style={{ width: "16%" }} />
      </div>
      <div className="mt-4 rounded-[10px] border border-ink/10 px-3.5 py-3 text-sm">
        <p className="font-semibold text-ink">Little Oaks Early Learning</p>
        <p className="text-muted-foreground">Oct 1 – 31 · $1,640 · ready to submit</p>
      </div>
    </div>
  );
}
