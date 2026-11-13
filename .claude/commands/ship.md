---
description: Проверить, задеплоить на Vercel и выдать прод-ссылку и чек-лист демо
---

Выполни по порядку, останавливайся при первой ошибке и чини её:

1. `npm run config:check`
2. `npm run lint`
3. `npm run build`
4. `npx playwright test` (локально, DEMO_MODE=true)
5. Проверь `.env.example`: все переменные, которые читает код, в нём перечислены.
6. Деплой на Vercel. Если проект не привязан — `npx vercel link`, затем перенеси переменные из `.env.local` в Vercel (`npx vercel env add NAME production`), НИКОГДА не печатай значения ключей. Нужные: DEMO_MODE, AI_PROVIDER, AI_MODEL, ANTHROPIC_API_KEY (если не демо), NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, ADMIN_PASSWORD, NEXT_PUBLIC_SITE_URL. Затем `npx vercel --prod`.
   Если нет доступа к Vercel — остановись и скажи, что нужно сделать пользователю.
7. Прогони smoke на проде: `BASE_URL=<прод-ссылка> npx playwright test`.
8. Проверь `<прод-ссылка>/api/health`: ok=true.

В конце выведи: прод-ссылку, результаты шагов (passed/failed), и чек-лист демо:
- открыть /api/health, /, /admin заранее (прогреть);
- режим: DEMO_MODE (true = без риска сети);
- пароль админки у докладчика;
- план Б: локальный `npm run dev` + mock;
- заготовленный ответ квиза для быстрого прохождения (~40 с).
