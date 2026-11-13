# PLAN.md — чек-лист задач

Порядок строгий. После каждой задачи: lint → build → браузер (если UI) → commit → отметить `[x]`.

## T0. Инструменты и skills (до кода) ✅
- [x] context7 + Playwright MCP подключены через `.mcp.json`
- [x] Skills подтверждены: `frontend-design`, `claude-api`, `dataviz`, `design:*`, `engineering:testing-strategy`, `engineering:deploy-checklist`, `simplify`, `code-review`, `security-review`
- [x] `git init`, `.gitignore`, первый коммит

## T1. Каркас ✅
- [x] Next.js 16 (App Router) + TS strict + Tailwind 4 + shadcn/ui
- [x] Структура папок, лейаут, тёмная тема, токены (Unbounded + Onest, с кириллицей, не Inter)
- [x] Переключатель ru/en (`useI18n()`: `t()`, `loc()`)
- [x] `.env.example`, кроссплатформенные скрипты

## T2. Конфиг-система ✅
- [x] `/config`: app / quiz / paywall / prompts / mocks / copy ru+en
- [x] Zod-схемы + валидация при импорте (`npm run config:check`)
- [x] Демо «Lumi — AI-коуч привычек» заполнен полностью

## T3. Supabase ✅ (код готов; живая проверка — когда появятся ключи)
- [x] Миграции в `/supabase/migrations/0001_init.sql` (единый файл для SQL Editor): `profiles`, `quiz_responses`, `ai_results`, `events`, `subscriptions`
- [x] RLS-политики; анонимный гость (`ensureGuest`) + email magic link (`sendMagicLink`)
- [x] Клиенты browser/admin, слой `lib/store.ts` с in-memory fallback, `npm run seed`
- [x] Без ключей приложение работает на in-memory + встроенном seed

**Готово, когда:** гость создаётся, строки пишутся и читаются под RLS; чужие данные недоступны; seed отрабатывает. (Нужны ключи Supabase.)

## T4. Движок квиз-онбординга ✅
- [x] Типы шагов: `single`, `multi`, `slider`, `text`, `photo-upload`, `info`, лоадер «строим ваш план»
- [x] Прогресс-бар, навигация назад, сохранение ответов (Supabase + локально)
- [x] Событие аналитики на каждый шаг (view/answer)

**Готово, когда:** квиз целиком управляется `quiz.config.ts`; обновление страницы не теряет прогресс.

## T5. AI-модуль ✅
- [x] `/lib/ai`: провайдеры `anthropic | gemini | mock`
- [x] `/api/ai/analyze`: ответы квиза + опционально фото, стриминг, JSON по Zod-схеме из конфига
- [x] Таймаут, 1 retry, fallback на mock при `DEMO_MODE` или ошибке
- [x] **Промежуточная проверка:** квиз → AI-результат в `DEMO_MODE=true` и с реальным ключом

**Готово, когда:** без сети результат всё равно появляется (mock); невалидный ответ модели не ломает UI.

## T6. Страница результата ✅
- [x] Персональный план из AI JSON: карточки, прогресс, блок «что получишь в премиуме»
- [x] Шаринг-ссылка (публичная read-only страница)

**Готово, когда:** красиво на 390px, есть loading/error/empty, ссылка открывается без авторизации.

## T7. Пейволл ✅
- [x] Тарифы и триал из конфига, таймер-оффер
- [x] Mock-checkout → `subscriptions` → разблокировка премиум-функции
- [x] A/B через `?v=b`, событие с вариантом

**Готово, когда:** покупка разблокирует премиум без перезагрузки; вариант B отличается и берётся из конфига.

## T8. Аналитика и /admin ✅
- [x] Дашборд воронки, конверсии по шагам, метрик-карточки
- [x] Seed демо-данных
- [x] Калькулятор юнит-экономики (CAC, CR, ARPU, churn → LTV, LTV/CAC, окупаемость)
- [x] Защита `/admin` паролем из env

**Готово, когда:** после seed видна живая воронка; смена параметра пересчитывает экономику мгновенно.

## T9. Лендинг и полировка ✅
- [x] Hero, ценность, соцдоказательство, CTA
- [x] loading/empty/error, анимации, доступность

**Готово, когда:** Lighthouse mobile Performance и Accessibility ≥ 90; путь проходим с клавиатуры.

## T10. Надёжность
- [x] `DEMO_MODE`, `/api/health`
- [x] Playwright smoke: лендинг → квиз → результат → пейволл → покупка → admin
- [ ] Деплой на Vercel

**Готово, когда:** smoke зелёный локально и на проде; `/api/health` = 200.

## T11. Хакатон-инструменты (`.claude/commands`) ✅
- [x] `/adapt-case <кейс>`: 3 идеи с оценкой → после выбора переписать ТОЛЬКО `/config` → build + smoke + commit
- [x] `/econ <гипотезы>`: пересчёт экономики, таблица, 3 тезиса
- [x] `/pitch`: `docs/PITCH.md` (3 минуты + 5 вопросов жюри)
- [x] `/creative`: 3 креатива 9:16 → `docs/CREATIVES.md`
- [x] `/ship`: lint, build, smoke, деплой, ссылка и чек-лист

## T12. Документация ✅
- [x] `README.md`
- [x] `HACKATHON_RUNBOOK.md`: адаптация за 30 минут, чек-лист демо, план Б (mock)

---

## Финальная репетиция (Промпт 4)
- [x] `/adapt-case` на кейсе Zimran (финграмотность у студентов) → до `/ship`
- [x] Отчёт: что сломалось, что исправлено, время, топ-5 рисков
- [x] Откат конфига к Lumi через git
