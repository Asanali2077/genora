# PLAN.md — GENORA build checklist

Details: `docs/ARCHITECTURE.md` · strategy: `docs/STRATEGY.md` · rules: `docs/HACKATHON_BRIEF.md`.
After each phase: lint → build → tests → browser check → commit → push.

## P1. Foundation ✅
- [x] Remove the Lumi template (quiz content, result/share pages, ru/en i18n, old admin/checkout, old commands)
- [x] Supabase schema `0002_genora.sql` applied: households, members, benefit_plans, receipts, school_calendars, coverage_plans, subscriptions, RLS, private `receipts` bucket
- [x] Light "kitchen calendar" theme (pine / marigold / sky), Bricolage Grotesque + Figtree
- [x] Landing with a live calculator running the real engine
- [x] Auth: anonymous session → household (needs Anonymous sign-ins enabled in Supabase)

## P2. Engine ✅
- [x] `lib/engine/tax-2026.ts`: 2026 brackets, standard deduction, §129, §21, §24, FICA, Trump Account — each with a source
- [x] `lib/engine/benefits.ts`: optimizer (FSA split across both employers vs care credit), cap guard, forfeiture, CTC, actions, show-math lines
- [x] 13 Vitest unit tests with hand-computed expectations

## P3. Onboarding → reveal ✅
- [x] `/start`: 11 questions, live "$ found" counter on every step
- [x] Save household + benefit plan (RLS) → `/reveal` with the found-money number and "show math" drawer

## P4. School-break radar ✅
- [x] Paste school calendar → Gemini extracts no-school days (Zod) → manual fallback
- [x] Coverage engine: gaps vs both parents' work days and PTO; PTO Tetris (PTO + FSA-eligible day camps, minimum cost) + unit tests

## P5. Claim vault ✅
- [x] Receipt photo/text → Gemini extraction → editable form → `receipts` + storage
- [x] Claimed-vs-elected burn-down, forfeiture pace meter, provider TIN check

## P6. Pricing, dashboard, partner ✅
- [x] `/pricing` (annual / monthly, 10× guarantee, mock checkout clearly labelled) → `subscriptions`
- [x] `/app` "Family Money Pulse": found money, burn-down, next gaps, actions
- [ ] Partner invite (if time)

## P7. Production ✅
- [x] Analytics events + `/admin` funnel with real events
- [x] Playwright e2e of the full path
- [x] Vercel production deploy connected to GitHub

## P8. Pitch
- [x] Slides: problem, user, demo path, engine, unit economics, $100M path, why now (13-slide deck on claude.ai, speaker notes with timing and Q&A)
- [ ] Rehearsal + Q&A answers
