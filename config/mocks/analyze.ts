import type { Locale } from "../app.config";
import { AnalyzeResultSchema, type AnalyzeResult } from "../prompts/analyze";

const ru: AnalyzeResult = {
  headline: "Ваш план: маленькие шаги, большой эффект",
  summary: "У вас хороший запас мотивации, но мало свободного времени. Мы построили план из микро-действий на 5–15 минут в ваш пик энергии.",
  score: 72,
  strengths: ["Чёткая цель", "Готовность выделять время каждый день", "Понимание своего пика энергии"],
  risks: ["Срывы после пропуска одного дня — заложены «страховочные» дни"],
  plan: [
    { day: 1, title: "Якорь", action: "Привяжите привычку к утреннему кофе: 5 минут тишины.", minutes: 5, premium: false },
    { day: 2, title: "Ровный старт", action: "Повторите якорь и добавьте 1 мин дыхания.", minutes: 6, premium: false },
    { day: 3, title: "Сигнал", action: "Поставьте заметку-триггер на видное место.", minutes: 5, premium: false },
    { day: 4, title: "Усложнение", action: "Увеличьте время до 10 минут.", minutes: 10, premium: true },
    { day: 5, title: "Страховка", action: "Подготовьте «план Б» на случай занятого дня.", minutes: 8, premium: true },
    { day: 6, title: "Награда", action: "Отметьте прогресс и выберите небольшую награду.", minutes: 5, premium: true },
    { day: 7, title: "Итоги недели", action: "Оцените, что сработало, и подкрутите план.", minutes: 10, premium: true },
  ],
  premiumTeaser: "Откройте дни 4–14, умные напоминания и AI-коуча на случай срыва.",
};

const en: AnalyzeResult = {
  headline: "Your plan: small steps, big effect",
  summary: "You have solid motivation but little spare time. We built micro-actions of 5–15 minutes timed to your energy peak.",
  score: 72,
  strengths: ["A clear goal", "Willing to commit time daily", "You know your energy peak"],
  risks: ["Slipping after one missed day — safety days are built in"],
  plan: [
    { day: 1, title: "Anchor", action: "Tie the habit to your morning coffee: 5 quiet minutes.", minutes: 5, premium: false },
    { day: 2, title: "Steady start", action: "Repeat the anchor and add 1 minute of breathing.", minutes: 6, premium: false },
    { day: 3, title: "Cue", action: "Place a trigger note somewhere visible.", minutes: 5, premium: false },
    { day: 4, title: "Level up", action: "Extend to 10 minutes.", minutes: 10, premium: true },
    { day: 5, title: "Safety net", action: "Prepare a plan B for a busy day.", minutes: 8, premium: true },
    { day: 6, title: "Reward", action: "Mark progress and pick a small reward.", minutes: 5, premium: true },
    { day: 7, title: "Weekly review", action: "Review what worked and tune the plan.", minutes: 10, premium: true },
  ],
  premiumTeaser: "Unlock days 4–14, smart nudges and an AI coach for slips.",
};

export const analyzeMock: Record<Locale, AnalyzeResult> = {
  ru: AnalyzeResultSchema.parse(ru),
  en: AnalyzeResultSchema.parse(en),
};
