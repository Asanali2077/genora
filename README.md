# Lumi starter — конфиг-управляемая заготовка подписочного AI-продукта

Квиз-онбординг → персональный AI-результат → пейволл → подписка → админка с воронкой и юнит-экономикой.
Демо-продукт: «Lumi — AI-коуч привычек». Вся кейс-специфика живёт в `/config`.

## Быстрый старт (Windows / PowerShell)
```powershell
npm install
copy .env.example .env.local    # заполнить при необходимости; DEMO_MODE=true работает без ключей
npm run dev                     # http://localhost:3000
```
Страницы: `/` лендинг · `/quiz` · `/result` · `/paywall` (`?v=a|b`) · `/r/<shareId>` шаринг · `/admin` · `/api/health`.

## Переменные окружения
См. `.env.example`. Минимум для демо: `DEMO_MODE=true`, `ADMIN_PASSWORD`.
Для реального AI: `DEMO_MODE=false`, `ANTHROPIC_API_KEY`, `AI_MODEL` (по умолчанию `claude-sonnet-5-5`); альтернатива — `AI_PROVIDER=gemini` + `GEMINI_API_KEY`.
Для БД: ключи Supabase, затем выполнить `supabase/migrations/0001_init.sql` в SQL Editor и (опц.) `npm run seed`.
Без Supabase всё работает на in-memory хранилище (данные пропадают при перезапуске).

## Структура
| Путь | Что там |
|---|---|
| `config/` | бренд, квиз, тарифы, AI-промпт и схема, mock-ответы, copy ru/en — ЕДИНСТВЕННОЕ место кейс-специфики |
| `lib/ai/` | провайдеры anthropic/gemini/mock, Zod, таймаут, retry, fallback |
| `lib/store.ts` | события, квиз, результаты, подписки (Supabase или in-memory) |
| `lib/econ.ts`, `lib/funnel.ts`, `lib/seed.ts` | юнит-экономика, воронка, демо-данные |
| `app/`, `components/` | UI без хардкод-текстов |
| `.claude/commands/` | `/adapt-case`, `/econ`, `/pitch`, `/creative`, `/ship` |
| `tests/` | Playwright smoke |

## Команды
`npm run dev | build | lint | config:check | seed` · `npx playwright test`

Подробный сценарий хакатона — в `HACKATHON_RUNBOOK.md`.
