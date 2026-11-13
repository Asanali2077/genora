// Единая точка входа в конфиг. Импорт = валидация Zod (ошибка конфига падает сразу и понятно).
export { appConfig, LOCALES, LocalizedSchema } from "./app.config";
export type { Locale, Localized, AppConfig } from "./app.config";
export { quizConfig } from "./quiz.config";
export type { QuizStep } from "./quiz.config";
export { paywallConfig } from "./paywall.config";
export type { PaywallConfig, PaywallPlan } from "./paywall.config";
export { analyzePrompt, AnalyzeResultSchema } from "./prompts/analyze";
export type { AnalyzeResult } from "./prompts/analyze";
export { analyzeMock } from "./mocks/analyze";
