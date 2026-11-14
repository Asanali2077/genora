/**
 * School-break radar + PTO Tetris.
 * Finds every weekday the kids have no school while the parents work, then covers those days at the
 * lowest cash cost: parents' spare PTO goes to the most expensive days first, the rest is paid care
 * (day camp during multi-day breaks, a sitter for single days when camps don't run). Pure and deterministic.
 */

export type Closure = { start: string; end: string; label: string }; // ISO dates, inclusive
export type CoverageParent = { label: string; ptoDays: number };
export type CoverageInput = {
  closures: Closure[];
  parents: CoverageParent[];
  kidsInCare: number; // children under 13
  campPerKidPerDay: number;
  sitterPerDay: number; // one sitter for all kids
  ptoReserve: number; // days each parent keeps for sickness
  campMinDays: number; // camps run only for breaks at least this long (in weekdays)
  combinedTaxRate: number; // marginal federal + FICA + state, for FSA savings on paid care
  fromDate?: string; // ignore days before this date
};

export type GapDay = { date: string; label: string; block: number; blockLength: number };
export type Assignment = { date: string; label: string; cover: "pto" | "camp" | "sitter"; who?: string; cost: number };
export type CoverageResult = {
  gapDays: number;
  assignments: Assignment[];
  ptoUsed: Record<string, number>;
  cashCost: number;
  allPaidCost: number;
  savedByPto: number;
  fsaEligible: number;
  fsaTaxSaved: number;
  blocks: { label: string; start: string; end: string; days: number }[];
};

const DAY = 86_400_000;
const toUtc = (iso: string) => Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10));
const toIso = (t: number) => new Date(t).toISOString().slice(0, 10);
const isWeekday = (t: number) => {
  const d = new Date(t).getUTCDay();
  return d !== 0 && d !== 6;
};

/** Expands closures into unique weekdays, grouped into consecutive blocks (weekends don't break a block). */
export function expandGapDays(closures: Closure[], fromDate?: string): GapDay[] {
  const from = fromDate ? toUtc(fromDate) : -Infinity;
  const byDate = new Map<string, string>();
  for (const c of closures) {
    const end = toUtc(c.end);
    for (let t = toUtc(c.start); t <= end; t += DAY) {
      if (t >= from && isWeekday(t) && !byDate.has(toIso(t))) byDate.set(toIso(t), c.label);
    }
  }
  const dates = [...byDate.keys()].sort();
  const days: GapDay[] = [];
  let block = -1;
  let prev = -Infinity;
  for (const d of dates) {
    const t = toUtc(d);
    // consecutive if the only days in between are a weekend
    let contiguous = prev !== -Infinity;
    if (contiguous) for (let x = prev + DAY; x < t; x += DAY) if (isWeekday(x)) contiguous = false;
    if (!contiguous) block++;
    days.push({ date: d, label: byDate.get(d)!, block, blockLength: 0 });
    prev = t;
  }
  const lengths = new Map<number, number>();
  for (const d of days) lengths.set(d.block, (lengths.get(d.block) ?? 0) + 1);
  for (const d of days) d.blockLength = lengths.get(d.block)!;
  return days;
}

export function planCoverage(input: CoverageInput): CoverageResult {
  const gaps = expandGapDays(input.closures, input.fromDate);
  const kids = Math.max(0, input.kidsInCare);
  const paidCost = (g: GapDay) =>
    kids === 0 ? 0 : g.blockLength >= input.campMinDays ? Math.min(input.campPerKidPerDay * kids, input.sitterPerDay) : input.sitterPerDay;
  const paidKind = (g: GapDay): "camp" | "sitter" =>
    g.blockLength >= input.campMinDays && input.campPerKidPerDay * kids <= input.sitterPerDay ? "camp" : "sitter";

  // Spare PTO per parent after the sick-day reserve.
  const spare = new Map(input.parents.map((p) => [p.label, Math.max(0, p.ptoDays - input.ptoReserve)]));
  const ptoUsed: Record<string, number> = Object.fromEntries(input.parents.map((p) => [p.label, 0]));

  // PTO Tetris: spend PTO on the most expensive days first (single days needing a sitter), alternating parents.
  const order = [...gaps].sort((a, b) => paidCost(b) - paidCost(a) || a.date.localeCompare(b.date));
  const covered = new Map<string, Assignment>();
  let turn = 0;
  for (const g of order) {
    if (kids === 0) break;
    const candidates = input.parents.filter((p) => (spare.get(p.label) ?? 0) > 0);
    if (candidates.length === 0) break;
    const p = candidates[turn++ % candidates.length];
    spare.set(p.label, spare.get(p.label)! - 1);
    ptoUsed[p.label]++;
    covered.set(g.date, { date: g.date, label: g.label, cover: "pto", who: p.label, cost: 0 });
  }

  const assignments: Assignment[] = gaps.map(
    (g) => covered.get(g.date) ?? { date: g.date, label: g.label, cover: paidKind(g), cost: paidCost(g) },
  );
  const cashCost = assignments.reduce((s, a) => s + a.cost, 0);
  const allPaidCost = gaps.reduce((s, g) => s + paidCost(g), 0);

  const blockMap = new Map<number, { label: string; start: string; end: string; days: number }>();
  for (const g of gaps) {
    const b = blockMap.get(g.block);
    if (b) {
      b.end = g.date;
      b.days++;
    } else blockMap.set(g.block, { label: g.label, start: g.date, end: g.date, days: 1 });
  }

  return {
    gapDays: kids === 0 ? 0 : gaps.length,
    assignments: kids === 0 ? [] : assignments,
    ptoUsed,
    cashCost: Math.round(cashCost),
    allPaidCost: Math.round(allPaidCost),
    savedByPto: Math.round(allPaidCost - cashCost),
    // Day camps and sitters that let parents work are eligible dependent-care expenses (Pub 503).
    fsaEligible: Math.round(cashCost),
    fsaTaxSaved: Math.round(cashCost * input.combinedTaxRate),
    blocks: [...blockMap.values()],
  };
}
