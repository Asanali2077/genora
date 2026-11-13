import { quizConfig } from "@/config/quiz.config";
import { paywallConfig } from "@/config/paywall.config";
import type { EventRow, SubRow } from "./store";

// Детерминированный PRNG, чтобы демо-цифры были стабильны.
function mulberry(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Генерирует правдоподобную воронку за последние 14 дней. Берёт шаги из quiz.config — адаптируется само. */
export function generateSeed(visitors = 1800): { events: EventRow[]; subs: SubRow[] } {
  const rnd = mulberry(42);
  const events: EventRow[] = [];
  const subs: SubRow[] = [];
  const steps = quizConfig.steps.filter((s) => s.type !== "loader");
  const now = Date.now();
  const day = 86400000;

  for (let i = 0; i < visitors; i++) {
    const sid = `seed_${i}`;
    // более поздние дни — чуть больше трафика
    const at = new Date(now - Math.floor(Math.pow(rnd(), 1.4) * 14 * day)).toISOString();
    const variant = rnd() < 0.5 ? "a" : "b";
    const push = (name: string, props: Record<string, unknown> = {}) =>
      events.push({ session_id: sid, name, props, variant, created_at: at, is_seed: true });

    push("landing_view");
    if (rnd() > 0.62) continue; // ~62% кликают в квиз
    let alive = true;
    for (let s = 0; s < steps.length && alive; s++) {
      push("quiz_step_view", { step: steps[s].id });
      // дроп-офф: сильнее на текстовых/фото шагах
      const drop = steps[s].type === "photo" ? 0.28 : steps[s].type === "text" ? 0.14 : 0.05;
      if (rnd() < drop) alive = false;
      else push("quiz_step_answer", { step: steps[s].id });
    }
    if (!alive) continue;
    push("quiz_complete");
    push("result_view");
    if (rnd() > 0.78) continue;
    push("paywall_view");
    const cr = variant === "b" ? 0.2 : 0.16; // вариант B чуть лучше — есть что показать жюри
    if (rnd() < cr) {
      const plan = paywallConfig.plans[Math.floor(rnd() * paywallConfig.plans.length)];
      push("purchase", { plan: plan.id });
      subs.push({ session_id: sid, plan_id: plan.id, status: rnd() < 0.2 ? "canceled" : plan.trialDays > 0 ? "trialing" : "active", price: plan.price, variant, created_at: at, is_seed: true });
    }
  }
  return { events, subs };
}
