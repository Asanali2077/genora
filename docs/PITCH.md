# Genora — 5-minute pitch + Q&A

Format: 5 minutes pitch, 2 minutes Q&A (Business Cup 2.0 final). Live demo on https://businesscup.vercel.app.
Slides: https://claude.ai/artifact/JrXoMgJW63ZPSZQp9dmxz9 (13 slides; speaker notes carry this script and the Q&A; export as PDF or PowerPoint from the deck's Share menu).

**One line:** Genora is the family budget that knows the rules.

## 1. The pain (0:00–0:40) — Who do we sell to? (15%)
- Maria, 34, product manager in California; husband Dan, 37, nurse. Mia is 3 (daycare $20k/yr), Leo is 8 (school + after-school).
- Childcare is their biggest new bill: $13,184 per child per year on average (Child Care Aware, 2025).
- Three leaks: (1) the wrong tax benefit — only ~5% of eligible employees use a Dependent Care FSA (Mercer); (2) school breaks — schools close ~29 days a year vs ~16 days of paid leave (Center for American Progress); (3) unclaimed FSA money is forfeited.
- Why now: from 2026 the FSA limit rose from $5,000 to $7,500 and the care credit changed — the right choice now flips inside the same income band.

## 2. The product, live (0:40–2:40) — Does it work? (40%)
1. Landing → "See a sample family" (or 11 questions, 3 minutes). Show the live calculator running the real engine.
2. Budget forecast: the next 12 months with what ordinary budgets miss — take-home after 2026 taxes, FSA savings every paycheck, tax credits in April, school breaks, sick season, holidays. Click a month for the breakdown; stress-test "daycare +10%" or "a month without pay".
2a. Benefits: "You're leaving $674 a year on the table." Process strip: 11 answers → 2026 rules → 151 scenarios → best plan. Optimizer curve: hover the peak. "Every number has its IRS rule — show the math."
3. Benefits scanner: "Try a sample guide" → in ~9 s Gemini reads the HR guide → "Found $2,100 a year": 10 backup-care days + $500 employer FSA contribution.
4. School breaks: paste the district calendar → 78 weekdays without school → PTO goes to the most expensive days, camps cover the rest → cost waterfall → "Add to my calendar".
5. Care SOS: "Leo is sick tomorrow" → best option ranked by real cost, messages to partner and manager ready.
6. Claims: snap a daycare receipt → AI reads it → pace meter "on track to forfeit $785 by Dec 31".
7. Overview: "Genora found your family $4,274 this year — 43× the price."
Engineering proof: engines are pure TypeScript with 30+ unit tests; AI only extracts; end-to-end test passes against production; RLS on every table; no SSNs collected.

## 3. What we sell and why they come back (2:40–3:30) — Value & retention (20%)
- $99/year per household (or $12/month), both parents included; 10× guarantee.
- Weekly: receipts and forfeiture alerts, Care SOS. Every break: calendar plan. Every November: open-enrollment election + HR letter. Life events by child age (kindergarten → change election; 13th birthday → benefits end).
- The savings counter makes the subscription's ROI visible every visit.

## 4. Why it makes money (3:30–4:20) — Business potential (15%)
- Market: 32.9M US families with children (BLS); ~5.5M pay for care for kids ≤ 13 (Census WP 2026-08, our arithmetic).
- Unit economics (base case, `/admin`): visit → paid 2.3%, blended CAC ≈ $31, LTV ≈ $132, LTV:CAC ≈ 4.3, annual plans pay back on day one.
- $100M ARR ≈ 855K households at $117 blended ARPU ≈ 2.6% of US families with children — reachable by widening from daycare payers to every dual-earner family (school breaks, Care SOS) and to elder-care dependents (same FSA).
- Growth loops: partner invite (2 users per plan), shareable "we found $X" card, guides as SEO.

## 5. Why it's new and why us (4:20–5:00) — Originality (10%)
- Every childcare-benefits optimiser today sells to employers (Kinside, Upwards, Nayya, Bright Horizons). No one works for the parent across both employers and every school break.
- Built in 24 hours on a free stack, with the same playbook Zimran uses: quiz → personal result → paywall → retention loops.

## Likely jury questions
1. **"Isn't this tax advice?"** — Educational estimates with the rule shown for every number; we never file returns. Disclaimer on every page; recommendations point to the plan administrator.
2. **"What stops HR platforms from copying it?"** — They are employer-bound (one employer, one plan). Genora is household-side: both employers, the school calendar, the receipts — data no single employer has.
3. **"How accurate is the AI?"** — AI never computes money. It extracts dates and amounts into Zod schemas, the parent confirms every field, and every flow works by hand if AI is down.
4. **"Retention after open enrollment?"** — Receipts weekly, Care SOS during sick season, school breaks all year, life events; the savings counter shows ROI every visit.
5. **"How do you acquire parents cheaply?"** — Partner invites, share cards from the "found money" moment, guides for search ("dependent care FSA vs credit 2026"), daycare-parent communities; paid social as a supplement (CAC model in `/admin`).
