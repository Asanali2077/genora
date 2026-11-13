import { z } from "zod";
import { LocalizedSchema } from "./app.config";

const base = { id: z.string().regex(/^[a-z0-9_]+$/), title: LocalizedSchema, subtitle: LocalizedSchema.optional() };
const Option = z.object({ id: z.string(), label: LocalizedSchema, emoji: z.string().optional() });

export const QuizStepSchema = z.discriminatedUnion("type", [
  z.object({ ...base, type: z.literal("single"), options: z.array(Option).min(2).max(8) }),
  z.object({ ...base, type: z.literal("multi"), options: z.array(Option).min(2).max(10), max: z.number().int().optional() }),
  z.object({
    ...base,
    type: z.literal("slider"),
    min: z.number(),
    max: z.number(),
    step: z.number().positive(),
    initial: z.number(),
    unit: LocalizedSchema.optional(),
    labels: z.object({ min: LocalizedSchema, max: LocalizedSchema }).optional(),
  }),
  z.object({ ...base, type: z.literal("text"), placeholder: LocalizedSchema, optional: z.boolean().default(false) }),
  z.object({ ...base, type: z.literal("photo"), optional: z.boolean().default(true) }),
  z.object({ ...base, type: z.literal("info"), body: LocalizedSchema, emoji: z.string().optional() }),
  z.object({ ...base, type: z.literal("loader"), messages: z.array(LocalizedSchema).min(2) }),
]);

export type QuizStep = z.infer<typeof QuizStepSchema>;

const QuizConfigSchema = z
  .object({ steps: z.array(QuizStepSchema).min(3) })
  .refine((q) => new Set(q.steps.map((s) => s.id)).size === q.steps.length, { message: "quiz step ids must be unique" })
  .refine((q) => q.steps[q.steps.length - 1].type === "loader", { message: "last quiz step must be a loader" });

const L = (ru: string, en: string) => ({ ru, en });

export const quizConfig = QuizConfigSchema.parse({
  steps: [
    {
      id: "goal", type: "single",
      title: L("Какую привычку хотите закрепить?", "Which habit do you want to lock in?"),
      subtitle: L("Начнём с главного.", "Let's start with the main one."),
      options: [
        { id: "sleep", emoji: "🌙", label: L("Режим сна", "Sleep routine") },
        { id: "move", emoji: "🏃", label: L("Движение и спорт", "Movement & sport") },
        { id: "focus", emoji: "🎯", label: L("Фокус и учёба", "Focus & study") },
        { id: "mind", emoji: "🧘", label: L("Спокойствие и медитация", "Calm & mindfulness") },
      ],
    },
    {
      id: "attempts", type: "single",
      title: L("Сколько раз вы уже пытались?", "How many times have you tried?"),
      options: [
        { id: "never", label: L("Ещё ни разу", "Never yet") },
        { id: "few", label: L("2–3 раза", "2–3 times") },
        { id: "many", label: L("Много раз, срываюсь", "Many times, I keep dropping it") },
      ],
    },
    {
      id: "info_why", type: "info", emoji: "💡",
      title: L("Вы не одиноки", "You're not alone"),
      body: L(
        "92% людей бросают привычку из-за слишком больших шагов. Lumi дробит цель на микро-действия до 5 минут.",
        "92% of people quit habits because the steps are too big. Lumi splits your goal into actions under 5 minutes.",
      ),
    },
    {
      id: "blockers", type: "multi", max: 3,
      title: L("Что мешает больше всего?", "What gets in your way most?"),
      subtitle: L("Выберите до 3.", "Pick up to 3."),
      options: [
        { id: "time", label: L("Нет времени", "No time") },
        { id: "energy", label: L("Нет энергии", "Low energy") },
        { id: "forget", label: L("Забываю", "I forget") },
        { id: "motivation", label: L("Пропадает мотивация", "Motivation fades") },
        { id: "phone", label: L("Отвлекает телефон", "Phone distracts me") },
      ],
    },
    {
      id: "minutes", type: "slider", min: 5, max: 60, step: 5, initial: 15, unit: L("мин", "min"),
      title: L("Сколько минут в день реально выделить?", "How many minutes a day can you really give?"),
      labels: { min: L("Совсем чуть-чуть", "Just a little"), max: L("Могу много", "Plenty") },
    },
    {
      id: "chrono", type: "single",
      title: L("Когда вы наиболее энергичны?", "When are you most energetic?"),
      options: [
        { id: "morning", emoji: "🌅", label: L("Утром", "Morning") },
        { id: "day", emoji: "☀️", label: L("Днём", "Daytime") },
        { id: "evening", emoji: "🌆", label: L("Вечером", "Evening") },
      ],
    },
    {
      id: "context", type: "text",
      title: L("Расскажите про свой обычный день", "Tell us about your usual day"),
      subtitle: L("Работа, учёба, график — пара предложений.", "Work, study, schedule — a sentence or two."),
      placeholder: L("Например: учусь до 15:00, потом подработка…", "E.g. classes till 3pm, then a part-time job…"),
      optional: true,
    },
    {
      id: "photo", type: "photo", optional: true,
      title: L("Фото вашего рабочего места", "A photo of your workspace"),
      subtitle: L("AI учтёт обстановку в советах. Необязательно.", "AI will factor it into tips. Optional."),
    },
    {
      id: "build", type: "loader",
      title: L("Строим ваш план", "Building your plan"),
      messages: [
        L("Анализируем ваш ритм…", "Analysing your rhythm…"),
        L("Подбираем микро-привычки…", "Picking micro-habits…"),
        L("Расставляем по дням…", "Scheduling the days…"),
        L("Почти готово ✦", "Almost done ✦"),
      ],
    },
  ],
});
