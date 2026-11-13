import { z } from "zod";

export const LOCALES = ["ru", "en"] as const;
export type Locale = (typeof LOCALES)[number];

/** Локализованная строка: все кейс-тексты в конфигах хранятся в таком виде. */
export const LocalizedSchema = z.object({ ru: z.string().min(1), en: z.string().min(1) });
export type Localized = z.infer<typeof LocalizedSchema>;

const AppConfigSchema = z.object({
  brand: z.object({
    name: z.string().min(1),
    emoji: z.string(),
    tagline: LocalizedSchema,
    description: LocalizedSchema,
  }),
  defaultLocale: z.enum(LOCALES),
  landing: z.object({
    heroTitle: LocalizedSchema,
    heroSub: LocalizedSchema,
    steps: z.array(z.object({ title: LocalizedSchema, body: LocalizedSchema })).min(3).max(4),
    values: z.array(z.object({ icon: z.string(), title: LocalizedSchema, body: LocalizedSchema })).min(3).max(6),
    proof: z.object({
      stats: z.array(z.object({ value: z.string(), label: LocalizedSchema })).min(2).max(4),
      reviews: z
        .array(z.object({ name: z.string(), role: LocalizedSchema, text: LocalizedSchema }))
        .min(2)
        .max(4),
    }),
  }),
  /** Параметры юнит-экономики (T8). Меняются командой /econ. */
  econ: z.object({
    cac: z.number().positive(),
    crToTrial: z.number().min(0).max(1),
    crTrialToPaid: z.number().min(0).max(1),
    monthlyPrice: z.number().positive(),
    monthlyChurn: z.number().min(0.001).max(1),
    grossMargin: z.number().min(0).max(1),
    currency: z.string(),
  }),
});

export type AppConfig = z.infer<typeof AppConfigSchema>;

const raw: AppConfig = {
  brand: {
    name: "Lumi",
    emoji: "✦",
    tagline: { ru: "AI-коуч привычек", en: "AI habit coach" },
    description: {
      ru: "Lumi собирает персональный план привычек под ваш ритм жизни и мягко ведёт к результату каждый день.",
      en: "Lumi builds a personal habit plan around your rhythm and gently guides you to results every day.",
    },
  },
  defaultLocale: "ru",
  landing: {
    heroTitle: {
      ru: "Привычки, которые наконец прилипают",
      en: "Habits that finally stick",
    },
    heroSub: {
      ru: "Ответьте на 8 вопросов — AI соберёт план под ваш график, энергию и цели. Без чувства вины.",
      en: "Answer 8 questions — AI builds a plan around your schedule, energy and goals. Zero guilt.",
    },
    steps: [
      { title: { ru: "Расскажите о себе", en: "Tell us about you" }, body: { ru: "8 коротких вопросов о ритме, целях и препятствиях.", en: "8 short questions on rhythm, goals and blockers." } },
      { title: { ru: "AI строит план", en: "AI builds your plan" }, body: { ru: "Персональная система из микро-привычек на 14 дней.", en: "A personal 14-day system of micro-habits." } },
      { title: { ru: "Идите шаг за шагом", en: "Go step by step" }, body: { ru: "Ежедневные подсказки и мягкие напоминания в Премиуме.", en: "Daily nudges and gentle reminders in Premium." } },
    ],
    values: [
      { icon: "Sparkles", title: { ru: "Персонально", en: "Truly personal" }, body: { ru: "План учитывает ваш chronotype, нагрузку и мотивацию.", en: "Accounts for your chronotype, workload and motivation." } },
      { icon: "Flame", title: { ru: "Микро-шаги", en: "Micro-steps" }, body: { ru: "Каждое действие занимает до 5 минут — срываться некуда.", en: "Every action takes under 5 minutes — nothing to fall off." } },
      { icon: "LineChart", title: { ru: "Виден прогресс", en: "Visible progress" }, body: { ru: "Индекс привычек растёт — и вы это видите.", en: "Your habit index grows — and you can see it." } },
    ],
    proof: {
      stats: [
        { value: "120K+", label: { ru: "планов построено", en: "plans built" } },
        { value: "4.8", label: { ru: "средняя оценка", en: "average rating" } },
        { value: "73%", label: { ru: "держат привычку 30 дней", en: "keep a habit for 30 days" } },
      ],
      reviews: [
        { name: "Алина", role: { ru: "студентка", en: "student" }, text: { ru: "Впервые удержала утреннюю рутину больше месяца.", en: "First time I kept a morning routine for over a month." } },
        { name: "Марат", role: { ru: "разработчик", en: "developer" }, text: { ru: "Микро-шаги — вот что сработало. Никакой ломки графика.", en: "Micro-steps are what worked. No schedule breakdown." } },
      ],
    },
  },
  econ: {
    cac: 4.5,
    crToTrial: 0.22,
    crTrialToPaid: 0.45,
    monthlyPrice: 9.99,
    monthlyChurn: 0.12,
    grossMargin: 0.8,
    currency: "$",
  },
};

export const appConfig = AppConfigSchema.parse(raw);
