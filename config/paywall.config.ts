import { z } from "zod";
import { LocalizedSchema } from "./app.config";

const Plan = z.object({
  id: z.string(),
  name: LocalizedSchema,
  price: z.number().positive(),
  period: z.enum(["week", "month", "year"]),
  trialDays: z.number().int().min(0),
  highlight: z.boolean().default(false),
});

const Variant = z.object({
  headline: LocalizedSchema,
  subline: LocalizedSchema,
  cta: LocalizedSchema,
  defaultPlan: z.string(),
  showTimer: z.boolean(),
});

const PaywallSchema = z
  .object({
    plans: z.array(Plan).min(1),
    offerTimerMinutes: z.number().int().positive(),
    premiumFeatures: z.array(z.object({ icon: z.string(), title: LocalizedSchema, body: LocalizedSchema })).min(3),
    variants: z.object({ a: Variant, b: Variant }),
  })
  .refine((p) => [p.variants.a.defaultPlan, p.variants.b.defaultPlan].every((id) => p.plans.some((pl) => pl.id === id)), {
    message: "variant.defaultPlan must reference an existing plan id",
  });

export type PaywallConfig = z.infer<typeof PaywallSchema>;
export type PaywallPlan = z.infer<typeof Plan>;
const L = (ru: string, en: string) => ({ ru, en });

export const paywallConfig: PaywallConfig = PaywallSchema.parse({
  plans: [
    { id: "week", name: L("Неделя", "Weekly"), price: 4.99, period: "week", trialDays: 0 },
    { id: "year", name: L("Год", "Yearly"), price: 49.99, period: "year", trialDays: 7, highlight: true },
    { id: "month", name: L("Месяц", "Monthly"), price: 9.99, period: "month", trialDays: 3 },
  ],
  offerTimerMinutes: 15,
  premiumFeatures: [
    { icon: "CalendarCheck", title: L("Полный 14-дневный план", "Full 14-day plan"), body: L("Каждый день расписан по минутам.", "Every day scheduled to the minute.") },
    { icon: "Bell", title: L("Умные напоминания", "Smart nudges"), body: L("Подсказки в ваш пик энергии.", "Nudges at your energy peak.") },
    { icon: "MessageCircle", title: L("AI-коуч в чате", "AI coach chat"), body: L("Спросите, что делать, когда сорвались.", "Ask what to do after a slip.") },
    { icon: "TrendingUp", title: L("Недельные отчёты", "Weekly reports"), body: L("Видно, что работает именно у вас.", "See what works for you.") },
  ],
  variants: {
    a: {
      headline: L("Откройте полный план", "Unlock your full plan"),
      subline: L("Все 14 дней, напоминания и AI-коуч.", "All 14 days, nudges and the AI coach."),
      cta: L("Начать бесплатный период", "Start free trial"),
      defaultPlan: "year",
      showTimer: true,
    },
    b: {
      headline: L("Ваш план уже готов — осталось открыть", "Your plan is ready — just unlock it"),
      subline: L("Попробуйте 3 дня бесплатно. Отмена в один тап.", "Try 3 days free. Cancel in one tap."),
      cta: L("Открыть мой план", "Unlock my plan"),
      defaultPlan: "month",
      showTimer: false,
    },
  },
});
