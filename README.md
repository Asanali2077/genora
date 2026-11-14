# Genora — the money engine for the childcare years

**Live:** https://businesscup.vercel.app · Business Cup 2.0 · Track: Money

Working US parents lose money on childcare in two ways: they pick the wrong tax benefit (only ~5% of eligible employees use a Dependent Care FSA, and in 2026 the FSA limit rose to $7,500 while the care credit changed), and they pay last-minute prices for school breaks nobody planned for. Genora fixes both with a deterministic 2026 tax engine, a school-break planner and an FSA claim tracker.

## What a family gets
| Feature | What it does | Where the value comes from |
|---|---|---|
| **Benefits optimizer** | Tests every Dependent Care FSA split across both parents' employers against the Child & Dependent Care Credit, adds the Child Tax Credit and Trump Account deposit, warns about the $7,500 household cap and forfeiture | `lib/engine/benefits.ts` + `lib/engine/tax-2026.ts` (every constant has a source link) |
| **School-break radar** | Paste the district calendar → AI extracts no-school days → the engine finds every uncovered weekday and assigns spare PTO to the most expensive days, the rest to FSA-eligible day camps or sitters | `lib/engine/coverage.ts` ("PTO Tetris") |
| **Claim vault** | Snap a receipt → AI reads provider, amount, service dates → tracks claimed vs elected, projects forfeiture to the deadline (incl. grace period), flags missing provider tax IDs, builds the Form 2441 summary | `lib/engine/claims.ts` |
| **Family money pulse** | Dashboard with money back this year, FSA risk, next no-school days and seasonal prompts (open enrollment, camp booking, tax season) | `app/app/page.tsx` |

**AI extracts, rules compute.** Gemini only turns messy input (calendars, receipt photos) into Zod-validated data. Every dollar figure is computed by pure, unit-tested code; if AI is unavailable, every flow has a manual path.

## Architecture
```
app/            routes: landing, /start (onboarding), /reveal, /pricing, /app (pulse, coverage, claims), /admin, /api/*
components/     UI by feature
config/         product copy, pricing, unit-economics assumptions
lib/engine/     pure 2026 rules: tax-2026, benefits, coverage, claims, economics
lib/ai/         provider registry (Gemini default; paid providers disabled unless ALLOW_PAID_AI=true) + extraction tasks
lib/services/   orchestration: engine + AI + Supabase
lib/supabase/   browser, server (user session, RLS) and service-role clients
supabase/       migrations: households, members, benefit_plans, receipts, school_calendars, coverage_plans, subscriptions, events — RLS by household membership, private receipts bucket
tests/unit      Vitest: engine rules with hand-computed expectations
tests/e2e       Playwright: landing → onboarding → reveal → pricing → dashboard → receipt (passes against production)
```
Stack: Next.js 16 · TypeScript strict · Tailwind 4 · Supabase (Auth anonymous sessions, Postgres, Storage) · Gemini · Vitest · Playwright · Vercel. Free tiers only.

## Run locally
```bash
npm install
cp .env.example .env.local   # Supabase URL + keys, GEMINI_API_KEY, ADMIN_PASSWORD
npm run dev                  # http://localhost:3000
npm test                     # engine unit tests
npx playwright test          # end-to-end (BASE_URL=https://businesscup.vercel.app to test production)
```
Database: run `supabase/migrations/*.sql` in the Supabase SQL editor and enable Anonymous sign-ins.

## Business
Pricing: $99/year or $12/month per household (both parents). Base case: blended CAC ≈ $31, LTV ≈ $132, LTV:CAC ≈ 4.3; ≈ 855K households for $100M ARR. Assumptions, sources and risks: `docs/STRATEGY.md`, `docs/RESEARCH.md`. Live funnel and model: `/admin`.

*Educational estimates based on 2026 federal rules, not tax advice. Checkout is a labelled demo; no card is charged.*
