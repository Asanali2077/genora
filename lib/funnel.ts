import "server-only";
import { quizConfig } from "@/config/quiz.config";
import { listEvents, listSubs, type EventRow, type SubRow } from "./store";
import { generateSeed } from "./seed";

export type FunnelData = {
  usingSeed: boolean;
  stages: { key: string; count: number; pct: number }[];
  steps: { id: string; views: number; answers: number; dropPct: number }[];
  variants: Record<"a" | "b", { paywall: number; purchases: number; cr: number }>;
  totals: { visitors: number; purchases: number; revenue: number; crVisitorToPaid: number; quizCompletion: number };
  daily: { day: string; visitors: number; purchases: number }[];
};

const uniq = (rows: EventRow[], name: string, pred?: (e: EventRow) => boolean) =>
  new Set(rows.filter((e) => e.name === name && (!pred || pred(e))).map((e) => e.session_id)).size;

export async function buildFunnel(): Promise<FunnelData> {
  let events: EventRow[] = await listEvents();
  let subs: SubRow[] = await listSubs();
  // Если демо-данных нет (в т.ч. не запускали npm run seed) — подмешиваем встроенные, чтобы дашборд не был пустым.
  const usingSeed = !events.some((e) => e.is_seed);
  if (usingSeed) {
    const s = generateSeed();
    events = [...events, ...s.events];
    subs = [...subs, ...s.subs];
  }

  const visitors = uniq(events, "landing_view");
  const firstStep = quizConfig.steps[0].id;
  const raw = [
    ["landing_view", visitors],
    ["quiz_start", uniq(events, "quiz_step_view", (e) => e.props?.step === firstStep)],
    ["quiz_complete", uniq(events, "quiz_complete")],
    ["result_view", uniq(events, "result_view")],
    ["paywall_view", uniq(events, "paywall_view")],
    ["purchase", uniq(events, "purchase")],
  ] as const;
  const base = Math.max(raw[0][1], 1);
  const stages = raw.map(([key, count]) => ({ key, count, pct: Math.round((count / base) * 1000) / 10 }));

  const steps = quizConfig.steps
    .filter((s) => s.type !== "loader")
    .map((s) => {
      const views = uniq(events, "quiz_step_view", (e) => e.props?.step === s.id);
      const answers = uniq(events, "quiz_step_answer", (e) => e.props?.step === s.id);
      return { id: s.id, views, answers, dropPct: views ? Math.round(((views - answers) / views) * 1000) / 10 : 0 };
    });

  const variants = { a: { paywall: 0, purchases: 0, cr: 0 }, b: { paywall: 0, purchases: 0, cr: 0 } };
  for (const v of ["a", "b"] as const) {
    const paywall = uniq(events, "paywall_view", (e) => e.variant === v);
    const purchases = uniq(events, "purchase", (e) => e.variant === v);
    variants[v] = { paywall, purchases, cr: paywall ? Math.round((purchases / paywall) * 1000) / 10 : 0 };
  }

  const paid = subs.filter((s) => s.status !== "canceled");
  const revenue = Math.round(paid.reduce((sum, s) => sum + Number(s.price), 0) * 100) / 100;

  const dayMap = new Map<string, { visitors: Set<string>; purchases: Set<string> }>();
  for (const e of events) {
    if (e.name !== "landing_view" && e.name !== "purchase") continue;
    const day = (e.created_at ?? "").slice(0, 10);
    const d = dayMap.get(day) ?? { visitors: new Set(), purchases: new Set() };
    (e.name === "landing_view" ? d.visitors : d.purchases).add(e.session_id);
    dayMap.set(day, d);
  }
  const daily = [...dayMap.entries()].sort(([a], [b]) => a.localeCompare(b)).slice(-14).map(([day, d]) => ({ day: day.slice(5), visitors: d.visitors.size, purchases: d.purchases.size }));

  const purchases = stages[5].count;
  return {
    usingSeed,
    stages,
    steps,
    variants,
    daily,
    totals: { visitors, purchases, revenue, crVisitorToPaid: Math.round((purchases / base) * 1000) / 10, quizCompletion: Math.round((stages[2].count / Math.max(stages[1].count, 1)) * 1000) / 10 },
  };
}
