# GENORA — product & architecture plan (draft for approval)

Name: **GENORA** (from Greek *genos* — kin, family): a scalable family ecosystem. First product: the money engine for the childcare years.

## 1. User and pain
**User:** working parents in the US, 27–40, one or two kids under 13, household income $80k–180k, both parents (or one) employed.

**Pain (Money track):** childcare is the family's biggest new expense and the hardest to plan.
- Average price of childcare in 2025: **$13,184 / year per child**, ~10% of median two-parent income; infant center care up to $27,067 in Massachusetts. Source: Child Care Aware of America, https://info.childcareaware.org/price-and-supply-2025
- From 2026 the Dependent Care FSA limit rose **from $5,000 to $7,500** (first increase since 1986), and the Child and Dependent Care Credit was enhanced. Sources: https://www.kiplinger.com/taxes/new-fsa-contribution-limits, https://www.mercer.com/en-us/insights/us-health-news/big-beautiful-bill-permanently-enhances-dependent-care-benefits/
- The two benefits cannot cover the same dollars; choosing between them and splitting them between two employers is confusing. Source: https://nationaltaxtools.com/guides/dependent-care-fsa-vs-tax-credit/
- Unused dependent-care FSA money is forfeited (no carryover). About 4 in 10 FSA holders forfeited money in 2024, avg $404 (all FSAs, not DCFSA-only). Source: https://401kspecialistmag.com/40-of-fsa-holders-forfeit-unused-funds-ebri-finds/
- School breaks, summer and in-service days create "coverage gaps" that parents patch at the last minute with expensive care or unpaid leave.

**One-line promise:** *"Find the money your family is leaving on childcare — and never get caught by a school break again."*

## 2. What makes it original (not a tracker, not a planner, not a chatbot)
1. **Benefits Stack Optimizer** — a deterministic 2026 tax engine that decides, for this exact family, how much to put in each parent's Dependent Care FSA, what remains for the tax credit, and what the Child Tax Credit adds. Output: **"$X / year you are leaving on the table"** + an action list with deadlines (open enrollment, life events).
2. **Gap Radar + PTO Tetris** — paste the school calendar (any text/PDF copy), AI extracts breaks and no-school days; the engine overlays both parents' work schedules and PTO and finds every uncovered day for the year, then **assigns PTO days and FSA-eligible day camps to minimise cash cost**. Output: a coverage plan and a "gap budget".
3. **Claim Vault** — snap a daycare/camp receipt, AI extracts provider, dates and amount; the app tracks how much FSA money is waiting to be claimed, warns before forfeiture, checks the provider tax ID needed for FSA and Form 2441, and builds a year-end summary.

Core value is computed in code from the family's own data. AI only parses messy inputs (calendars, receipts) and explains results; if AI is unavailable, everything still works with manual input.

## 3. Why they pay and why they come back
| | |
|---|---|
| Free (hook) | Onboarding → "found money" estimate + first 3 coverage gaps |
| Pro $12/mo or $99/yr (household, both parents) | full optimizer plan, Gap Radar for the whole year with PTO Tetris, Claim Vault, partner sharing, deadline reminders |
| Value argument | typical found money ≈ $7,500 × (marginal federal rate + 7.65% FICA) ≈ $2,000+/yr vs $99/yr |
| Return triggers | every childcare payment (receipt), weekly "Family Money Pulse", upcoming gap alerts, FSA forfeiture countdown, open-enrollment season |

Unit economics and $100M ARR arithmetic go into the pitch (≈ 840K households at $99/yr; benchmarks in `docs/RESEARCH.md`).

## 4. MVP scope (24h) — prioritised by research (see `docs/STRATEGY.md`)
| Feature | Metric it moves | Effort | Priority |
|---|---|---|---|
| Benefits Stack Optimizer + "show math" drawer | activation, paywall conversion | M | MUST |
| Onboarding (11 questions, live "$ found" counter) → reveal → paywall | quiz completion, conversion | S | MUST |
| Claim Vault: receipt → Gemini extraction → claimed-vs-elected burn-down | weekly actives | M | MUST |
| Forfeiture pace meter ("on track to forfeit $640 by Mar 15") | retention | S | MUST |
| Two-employer cap guard (both elections + backup care ≤ $7,500) | trust, partner value | S | MUST |
| Gap Radar: paste school calendar → AI dates → uncovered days | week-1 retention | M | SHOULD |
| PTO Tetris (greedy optimiser: PTO + FSA-eligible day camps) | engagement, originality | M | SHOULD |
| Mid-year change letter (Reg. 1.125-4(f)) when provider/cost changes | originality, value | S | SHOULD |
| Form 2441 year-end summary | tax-season retention | S | SHOULD |
| Partner invite | users per subscription, K-factor | M | LATER (if time) |
| Camp eligibility classifier (paste camp URL → day vs overnight) | originality | S | LATER |
**Won't (now):** state taxes beyond a flat estimate, bank linking, real payments, mobile app, health FSA.

**Onboarding questions (11):** filing status · household AGI (range) · lower earner's earned income · children's birth years · annual childcare spend by type (daycare / after-school / nanny / day camp / overnight camp) · employer DCFSA offered + current election (per parent) · backup-care benefit $ · plan year end + grace period · relative as provider? · state · PTO days per parent.

## 5. Architecture
### Stack (kept from the template)
Next.js 16 App Router + TypeScript strict + Tailwind 4 + shadcn/ui, Zod, Recharts, Supabase (Auth + Postgres + Storage, Free), Gemini free API, Playwright, Vercel Hobby. **Add:** Vitest for engine unit tests.

### Layers
```
app/                    routes (UI only)
  (marketing)/          landing, pricing
  start/                onboarding quiz (family profile)
  reveal/               free "found money" result
  app/                  Pro area: dashboard, benefits, coverage, receipts, household
  admin/                funnel (real events only)
  api/                  thin route handlers → lib/services
components/             UI by feature (onboarding/, benefits/, coverage/, receipts/, ui/)
lib/
  engine/               PURE, deterministic, unit-tested — the core value
    tax-2026.ts         constants with source links (brackets, caps, rates)
    benefits.ts         FSA split, dependent-care credit, child tax credit, found money
    coverage.ts         calendar overlay, gap detection, PTO Tetris
  ai/                   provider registry (gemini | mock; ollama/openai-compatible later)
    tasks/              parseSchoolCalendar, parseReceipt, explainPlan — each with a Zod schema
  services/             orchestration: engine + AI + DB (household, receipts, plans)
  db/                   Supabase clients, typed queries
  analytics/            funnel events
config/                 brand, copy, pricing, onboarding questions (English only)
supabase/migrations/    schema + RLS
tests/                  unit (vitest) + e2e (playwright)
docs/                   brief, research, architecture, pitch
```

### Data model (Supabase, RLS by household membership)
| Table | Key fields |
|---|---|
| households | id, name, filing_status, state, created_by |
| household_members | household_id, user_id, role (owner/partner) |
| parents | household_id, label, annual_income, employer_has_dcfsa, dcfsa_election, pto_days, work_days |
| children | household_id, name, birth_date |
| care_arrangements | child_id, type (daycare/nanny/after-school/camp), cost, period, season, provider_name, provider_tax_id |
| school_calendars | household_id, school_year, raw_text, parsed_events (jsonb) |
| coverage_plans | household_id, gaps (jsonb), assignments (jsonb), gap_budget |
| benefit_plans | household_id, inputs (jsonb), result (jsonb), found_money, engine_version |
| receipts | household_id, child_id, provider, amount, service_from, service_to, file_path, status (logged/claimed) |
| subscriptions | household_id, plan, status, source ('mock') |
| events | session_id, user_id, name, props — funnel analytics |

Storage bucket `receipts` (private, per-household folder).

### Engine rules (verified against statute; 2026 Pub 503 / Form 2441 not yet published)
| Rule | 2026 value | Source |
|---|---|---|
| DCFSA limit | $7,500 per household, $3,750 MFS; ≤ lower spouse's earned income (student/disabled spouse deemed $250/mo for 1 child, $500/mo for 2+); backup-care benefits count toward it | §129, https://www.law.cornell.edu/uscode/text/26/129 |
| Care credit rate | 50%, −1 pt per $2,000 AGI over $15,000 down to 35%; then −1 pt per $4,000 over $150,000 (joint) / $2,000 over $75,000 (other) down to 20% | §21, https://www.law.cornell.edu/uscode/text/26/21 |
| Care credit expense cap | $3,000 (1 child) / $6,000 (2+), minus DCFSA dollars; ≤ lower spouse's earned income | §21(c),(d) |
| Child Tax Credit | $2,200 per child under 17, refundable up to $1,700; phase-out −$50 per $1,000 over $400k joint / $200k other | §24; Rev. Proc. 2025-32 (practitioner summary) |
| Age | care benefits: child under 13; CTC: under 17 | Pub 503 |
| Eligible care | preschool, before/after-school, nanny, day camp; NOT overnight camp, kindergarten+ tuition, summer school, tutoring, payments to spouse / own child under 19 | §21(b)(2)(A), Pub 503 |
| Provider TIN | required on the return (501(c)(3) exempt); keep Form W-10 | §21(e)(9) |
| DCFSA deadlines | no carryover; optional grace period to the 15th day of the 3rd month after year-end; optional run-out | IRS Notice 2005-42 |
| Mid-year change | allowed on provider change, hours change, non-relative cost change, status changes | Reg. 1.125-4(f) |
| Taxes saved by DCFSA | marginal federal rate (2026 brackets) + 7.65% FICA (≤ $184,500 wage base) + flat state estimate | Rev. Proc. 2025-32; SSA |
| Extra lever | Trump Account: $1,000 federal deposit for children born 2025–2028 (elect on Form 4547) | https://www.irs.gov/trumpaccounts |
Every constant lives in `lib/engine/tax-2026.ts` with its source URL; every rule has a unit test (visible to judges).

### AI tasks (Gemini free key, mock fallback clearly labelled)
| Task | Input | Output (Zod) | Fallback |
|---|---|---|---|
| parseSchoolCalendar | pasted calendar text | list of no-school dates with labels | manual date picker |
| parseReceipt | photo / text | provider, amount, dates, tax ID if present | manual form |
| explainPlan | engine result | 3 plain-English bullets | template text from numbers |

## 6. Cleanup of the template (on approval)
| Remove | Why |
|---|---|
| Lumi habit content: quiz, prompts, mocks, landing copy | wrong product |
| `/result`, `/r/[shareId]`, generic `/api/ai/analyze` | replaced by reveal + feature APIs |
| ru/en i18n layer and language switcher | US-only product, English UI; copy stays centralised in `config/` |
| `/adapt-case`, `/creative` commands, `HACKATHON_RUNBOOK.md`, `docs/IDEAS.md` | no longer relevant |
| seeded fake funnel shown as real data | judges penalise faked data; keep seed only behind a clearly labelled demo toggle |
| Anthropic as default provider | free stack: Gemini default; Anthropic stays as an optional provider in the registry |

| Keep | |
|---|---|
| Next/Tailwind/shadcn shell, theme tokens and fonts (restyled for families) | |
| quiz engine (generalised for the family profile) | |
| paywall + mock checkout (labelled), subscriptions | |
| analytics events, admin funnel, unit-economics calculator | |
| AI provider abstraction with Zod + timeout + retry + fallback | |
| Supabase clients, Playwright smoke, `/api/health`, `/ship`, `/pitch`, `/econ` | |

## 7. Build phases (each ends with lint + build + tests + commit + your review)
| # | Phase | Hours | Checkpoint for you |
|---|---|---|---|
| P1 | Cleanup + new schema + auth (anonymous → email) | 1.5 | app shell runs, tables in Supabase |
| P2 | Engine: tax-2026 + benefits optimizer + unit tests | 2.5 | test table of example families with expected $ |
| P3 | Onboarding + found-money reveal | 2 | full free path in browser |
| P4 | Gap Radar (calendar AI + overlay + PTO Tetris) | 3 | paste a real school calendar → gaps |
| P5 | Claim Vault (receipt AI + storage + balances) | 2 | photo → logged claim |
| P6 | Paywall, dashboard "Family Money Pulse", partner invite | 2 | end-to-end paid path |
| P7 | Deploy, e2e, admin with real events | 1.5 | production URL |
| P8 | Pitch, unit economics, creatives | 3 | slides + rehearsal |

## Information architecture (UI)

The app is organised by the questions a parent asks, not by the engines behind them. `config/nav.ts` is the single map: the sidebar, the mobile tab bar and menu sheet, the ⌘K / "/" command menu, page breadcrumbs and locked-screen previews all read from it.

| Section | Screen | The question it answers |
|---|---|---|
| — | Today (`/app`) | What needs us this week, and are we okay? |
| Money | Budget forecast | Will we have enough every month this year? |
| Money | Taxes & benefits | FSA or tax credit — which split pays us most? |
| Money | Claims & receipts (plan) | Are we claiming every FSA dollar before the deadline? |
| Care | School breaks (plan) | Who is with the kids on every day off school? |
| Care | Sick day plan | Kid sick tomorrow — cheapest way to cover it? |
| Family | Kids & partner | Who's in the plan and what changes as kids grow? |
| Family | Letters & forms (plan) | What exactly do I send HR and the daycare? |
| — | Ask Genora | Anything, answered from the family's numbers. |

Today is built around one list, "Needs you", produced by the pure `lib/engine/actions.ts` (`nextActions`, unit-tested): every action comes from a computed fact, carries the dollars at stake and a due date when there is one, and disappears when the fact changes. Next to it, three figures (take-home pay, money back from tax rules, lowest balance) each link to the screen that explains them. Long screens use sticky in-page section tabs (`components/app/section-tabs.tsx`); paid screens for free families show what they unlock instead of a dead end.