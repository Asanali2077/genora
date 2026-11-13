# CLAUDE.md — Business Cup 2.0: конфиг-управляемая заготовка подписочного AI-продукта

## Контекст
Хакатон Business Cup 2.0 (организатор Zimran: Coursiv, Finelo). Модель продукта: квиз-онбординг → персональная ценность (AI) → пейволл → подписка; перформанс-маркетинг; метрики LTV/CAC.
Цель: универсальная заготовка, которую за 30 минут адаптируют под любой кейс, меняя только конфиг и промпты. Демо должно работать с первой попытки, в том числе без интернета к AI (DEMO_MODE / mock).
Демо-продукт по умолчанию: «Lumi — AI-коуч привычек» (вымышленный).

## Стек
Next.js (последняя стабильная, App Router) + TypeScript strict + Tailwind + shadcn/ui, Supabase (auth, Postgres, Storage), Zod, Recharts, Playwright, деплой на Vercel.
AI: Anthropic API по умолчанию, модель из `AI_MODEL` (по умолчанию `claude-sonnet-5-5`), абстракция провайдера (`anthropic | gemini | mock`).
Актуальную документацию библиотек проверяй через context7, не по памяти. По Claude API используй skill `claude-api`.

## Окружение
Windows + PowerShell. Все npm-скрипты и команды — кроссплатформенные (без bash-измов в package.json; для файловых операций — Node-скрипты или `cross-env`/`rimraf`).

## Жёсткие правила
1. **Вся кейс-специфика живёт ТОЛЬКО в `/config`**: `app.config.ts`, `quiz.config.ts`, `paywall.config.ts`, `prompts/*.ts`, `mocks/*`, copy `ru`/`en`. Компоненты не содержат хардкод-текстов, цен, брендов, названий тарифов. Конфиг валидируется Zod при старте.
2. **Mobile first (390px)**, затем десктоп. Тёмная тема по умолчанию.
3. **Любой AI-вызов**: Zod-схема ответа, таймаут, 1 retry, fallback на mock из `/config/mocks` при `DEMO_MODE=true` или при ошибке. Пользователь никогда не видит сырую ошибку провайдера.
4. **Секреты** только в `.env.local` (в `.gitignore`). Любая новая переменная сразу попадает в `.env.example` с комментарием. `SUPABASE_SERVICE_ROLE_KEY` и `ANTHROPIC_API_KEY` — только на сервере, никогда не в клиентском бандле и не в `NEXT_PUBLIC_*`.
5. **Цикл после каждой задачи**: `npm run lint` → `npm run build` → исправить ошибки → проверка в браузере (если есть UI) → `git commit` с понятным сообщением → отметить `[x]` в `PLAN.md`.
6. **Не добавлять функции вне `PLAN.md`.** Не переусложнять: это хакатон, а не прод. Без лишних абстракций, без преждевременной оптимизации.
7. **Остановка только по делу**: спрашивать пользователя только если нужны ключи/доступы (Supabase, Anthropic, Vercel) или есть блокер. Иначе принимать разумный дефолт и фиксировать его.
8. Миграции Supabase лежат в `/supabase/migrations`. Если CLI недоступен — выдать SQL одним файлом для SQL Editor.

## Дизайн и UI
- Использовать skill `frontend-design`: выразительный, НЕ шаблонный дизайн. Запрещено по умолчанию: Inter + фиолетовые градиенты, стандартные «SaaS-карточки». Нужны характерная пара шрифтов (display + text, через `next/font`), продуманная шкала типографики, свой цветовой токен-набор в CSS-переменных, микроанимации (framer-motion / CSS), аккуратные состояния hover/focus/loading/empty/error.
- Доступность: контраст AA, видимый фокус, aria для интерактива, `prefers-reduced-motion`, тап-зоны ≥ 44px.
- Графики и дашборды — по skill `dataviz` (Recharts, единая палитра, доступные цвета).

## Рекомендуемые skills (использовать по месту)
| Когда | Skill |
|---|---|
| Любой UI | `frontend-design`, `design:ux-copy` (микрокопи), `design:accessibility-review` |
| Работа с Claude API | `claude-api` |
| Тесты / Playwright | `engineering:testing-strategy` |
| Перед коммитом крупных задач | `simplify`, `code-review`, `security-review` |
| Перед деплоем | `engineering:deploy-checklist` |
| Дашборд /admin, воронка | `dataviz`, `data:build-dashboard` (как референс) |
| Питч и креативы | `marketing:content-creation`, `marketing:campaign-plan` |

## Структура (целевая)
```
/app            маршруты (landing, /quiz, /result, /paywall, /admin, /api/*)
/components     UI без хардкод-текстов
/config         app/quiz/paywall конфиги, prompts/*, mocks/*, copy/{ru,en}
/lib            ai/, supabase/, analytics/, econ/, i18n/
/supabase       migrations/, seed
/tests          Playwright smoke
/docs           PITCH.md, CREATIVES.md
/.claude        commands/, skills/
```

## Definition of Done для задачи
Критерии из `PLAN.md` выполнены; lint и build зелёные; UI проверен на 390px и десктопе; работает в `DEMO_MODE=true`; коммит сделан; чекбокс отмечен.
