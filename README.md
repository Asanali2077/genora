# Genora — the family budget that knows the rules

**Live:** https://businesscup.vercel.app · **Track:** Money · Business Cup 2.0 (B2C, web only)

Ordinary budgets look backward at spending. A working family's year is decided by things they miss: tax rules that changed in 2026 (Dependent Care FSA limit up to $7,500, a new care-credit schedule, the Child Tax Credit), benefits nobody claims (only ~5% of eligible employees use a Dependent Care FSA), ~29 no-school days against ~16 days of paid leave, sick season, holidays, and each child's age milestones. Genora builds a 12-month forecast with all of it included, finds the money the family is leaving on the table, and helps them act on it every week.

## How Genora answers the judging criteria

| Criterion | Where to see it |
|---|---|
| **40% · Does it work?** End-to-end in production, real core value | Live on Vercel; `tests/e2e/full-path.spec.ts` passes against production (`BASE_URL=https://businesscup.vercel.app npx playwright test`). Every dollar figure comes from pure, unit-tested engines in `lib/engine` (37 Vitest tests with hand-computed expectations, 2026 constants sourced in `tax-2026.ts`). AI only extracts data (calendars, receipts, benefits guides) and explains; it never produces tax numbers. |
| **20% · What do we sell?** Why pay, why come back | $99/yr per household. Weekly: claim vault + forfeiture pace, Care SOS when a kid is sick, school-break plan in your calendar, life events by child age, a running "Genora found you $X" counter with ROI. See `/pricing` ("Why families keep Genora all year"). |
| **15% · Who do we sell to?** | Working US parents 25–45 with kids under 13, household income $80k–180k, one or two employers. Research and sources: `docs/RESEARCH.md`, `docs/STRATEGY.md`. |
| **15% · Why does it make money?** $100M ARR, LTV > CAC | Base case CAC ≈ $31, LTV ≈ $132, LTV:CAC ≈ 4.3; ≈ 855K households for $100M ARR (of 32.9M US families with children). Live model and real funnel in `/admin`; formulas in `lib/engine/economics.ts` (tested). |
| **10% · Is it new?** | Everyone who optimises childcare benefits sells to employers (Kinside, Upwards, Nayya, Bright Horizons). Genora is the parent's side: both employers, both parents, every school break. Comparison on the landing page. |

Pass/fail: **B2C** (sold to parents, no employer contract) · **web only** (Next.js, responsive, no app) · submission: this repo, the live link, and the pitch (`docs/PITCH.md`).

## Product
| Feature | Engine | AI |
|---|---|---|
| **12-month budget forecast** with month-by-month breakdown and stress tests | `budget.ts`: take-home pay (federal, FICA, state), FSA savings, April tax credits, bills, childcare with kindergarten transitions, school-break plan, sick days by age, holidays | — |
| Benefits optimizer + optimizer curve ("show the math") | `benefits.ts` tests 151 FSA elections in $50 steps vs the §21 credit, §24 CTC, FICA, state | — |
| Employer benefits scanner | `family.ts › valueBenefits` prices backup care and cash benefits | Gemini reads the PDF guide |
| School-break radar + PTO Tetris + calendar export | `coverage.ts` | Gemini reads the district calendar |
| Claim vault, pace meter, Form 2441 summary | `claims.ts` | Gemini reads receipt photos |
| Care SOS | `family.ts › careOptions` | — |
| Paperwork (HR election, mid-year change, W-10) | `paperwork.ts` templates from engine numbers | — |
| Life events, savings counter, what-if planner | `family.ts`, `benefits.ts` | — |
| Ask Genora | answers grounded in the family's engine output | Gemini |
| Partner invite, onboarding, pricing, admin funnel | Supabase RLS, anonymous sessions | — |

## Architecture
```
app/            routes: landing, /start, /pricing, /guides, /app (overview, budget, benefits, coverage, claims, paperwork, sos, ask, family), /admin, /api/*
lib/engine/     pure 2026 rules: tax-2026, budget, benefits, coverage, claims, family, paperwork, economics
lib/ai/         provider registry (Gemini free tier; paid providers disabled unless ALLOW_PAID_AI=true) + extraction tasks with Zod schemas
lib/services/   engine + AI + Supabase orchestration (per-request cached household loading)
supabase/       migrations with RLS by household membership; private receipts bucket
tests/unit      Vitest · tests/e2e Playwright
```
Next.js 16 · TypeScript strict · Tailwind 4 · Supabase Free (anonymous auth, Postgres, Storage) · Gemini · Vercel Hobby (`syd1`, next to the database). Free tiers only.

## Run locally
```bash
npm install
cp .env.example .env.local      # Supabase URL + keys, GEMINI_API_KEY, ADMIN_PASSWORD
npm run dev                     # http://localhost:3000
npm test                        # engine unit tests
npx playwright test             # end-to-end
npm run samples                 # sample families and what the engine returns
```
Database: run `supabase/migrations/*.sql` in order in the Supabase SQL editor and enable Anonymous sign-ins.

*Educational estimates based on 2026 federal rules, not tax advice. Checkout is a labelled demo; no card is charged.*
