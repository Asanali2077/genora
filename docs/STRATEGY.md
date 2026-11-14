# GENORA — market, metrics and value strategy

Synthesis of three research passes (market & competitors, metrics & unit economics, product & US tax rules), 2026-11-14.
Items marked **[U]** are unverified or our own arithmetic; check before they go on a slide.

## 1. The insight we sell
- Only **5%** of eligible employees enroll in a Dependent Care FSA (avg contribution $3,220), while **46%** of civilian workers have access. Sources: Mercer 2023 via https://www.mercer.com/en-us/insights/us-health-news/big-beautiful-bill-permanently-enhances-dependent-care-benefits/ ; BLS https://www.bls.gov/ebs/factsheets/flexible-benefits-in-the-workplace.htm
- From 2026 the choice got harder: DCFSA cap $7,500 per household (§129) and a richer care credit (50% → 35% → 20% by AGI, §21). FSA dollars reduce the credit's expense cap dollar-for-dollar. Sources: https://www.law.cornell.edu/uscode/text/26/129 , https://www.law.cornell.edu/uscode/text/26/21
- **The right answer flips inside our target band [U, our arithmetic]:** 2 kids, joint AGI ≤ $150k → credit $2,100 vs DCFSA ≈ $2,224 (22% + 7.65% FICA) — near tie, state tax decides; at $180k → credit $1,620 vs DCFSA ≈ $2,374; 1 child → DCFSA wins clearly. A real decision that needs a real engine.
- Schools close ≈ 29 days a year vs ≈ 16 days of paid leave. Source: https://www.americanprogress.org/article/workin-9-to-5-2/ . Parents spend ≈ $893 per child on summer care and 62% of those paying went into debt (LendingTree 2025, small sample). https://www.lendingtree.com/debt-consolidation/summer-activities-survey/

## 2. Market
| Layer | Households | At $99/yr | Basis |
|---|---|---|---|
| TAM | 32.9M families with children | $3.26B | BLS https://www.bls.gov/news.release/famee.nr0.htm |
| SAM (paid care, kids ≤ 13) | ≈ 5.5M [U] | ≈ $545M | 23.9% pay for care, avg $10,520 (Census WP 2026-08) × assumed 23M households with kids ≤ 13 |
| SAM with DCFSA access | ≈ 2.5M [U] | ≈ $250M | × 46% access |
| SOM (3 yrs) | ≈ 110K [U] | ≈ $10.9M ARR | 2% of paid-care SAM |

**$100M ARR path:** ≈ 855K households at ≈ $117 blended ARPU. Credible only if (1) Gap Radar serves all dual-earner families (66.3% of married couples with kids, BLS), not only daycare payers; (2) a ~$149 tier; (3) expansion to elder-care dependents (same §129 FSA) — the GENORA "family ecosystem".

## 3. Competitive edge
Everyone who optimises childcare benefits sells to employers: Kinside, Upwards, Nayya, Bright Horizons, Brightwheel (B2B). Consumer apps (Care.com, Winnie, Cozi, Monarch, Honeydue, TurboTax) find care, track spend or file backward — none plans forward across **both parents' employers**.
**Moat:** consumer side + two employers + the household calendar data Gap Radar accumulates.

**Positioning:** "Most families who could use a dependent care FSA don't — and in 2026 picking the FSA or the tax credit wrongly can cost $1,000+. GENORA runs both parents' benefits in 3 minutes and tells you exactly what to elect."

## 4. Metrics where we win → the feature that wins them
| Metric | Benchmark | GENORA target | Feature that drives it |
|---|---|---|---|
| Quiz completion | 50–70% (Adapty) | 75% | 11 questions, live "$ found" counter on every step |
| Paywall → paid | 2–5%, web ≈ 6% (Adapty, web2wave) | 7–10% | **Found-money reveal before the paywall**, "show math" drawer, 10×-or-refund guarantee |
| Annual plan share | 40% NA (RevenueCat 2026) | 65% | Plan year = FSA year; annual price anchored to savings |
| Refunds | 2–5% (RevenueCat) | < 2% | Savings ledger proves value |
| Annual renewal | 44.1% (RevenueCat) | 55–60% | Seasonal loops: Nov enrollment, Feb–Apr camps, Aug–Sep school calendar, Mar 15 grace deadline |
| Weekly actives | — | receipt cadence | Claim Vault burn-down + forfeiture pace meter |
| Users per subscription | 1 | 1.6 [U] | Partner invite, shared calendar, two-employer cap guard |
| Organic share of new subs | — | 30% [U] | "Send to HR" one-pager, shareable savings card, partner invite |

**North star:** verified dollars saved per active household per plan year (optimized benefit + reimbursements claimed + forfeiture avoided).
**Input metrics for the pitch:** activation (visit → savings reveal), monetization (reveal → paid, annual share), value capture (% of elected FSA claimed on time, partner-invite rate).

## 5. Unit economics (3-year horizon)
Formulas: visit→paid = start × complete × paywall × buy; paid CAC = CPC ÷ visit→paid; blended CAC = paid CAC × (1 − organic share); annual LTV = $99 × (1 + R1 + R1·R2); monthly LTV = $12 ÷ churn; LTV net = mix × (1 − refunds) × gross margin.

| | Conservative | Base | Optimistic |
|---|---|---|---|
| Blended CAC | $196 | $31 | $10 |
| LTV | $87 | $132 | $170 |
| LTV : CAC | 0.44 | 4.3 | 17 |
| Payback | not reached | annual plans day 0 | day 0 |

Conservative fails on paid Meta traffic alone → **paywall conversion and organic share decide the model**, which is why the reveal, the guarantee and the HR / partner loops are MUST features. CPC/funnel sources: WordStream, Adapty, RevenueCat (see research notes); gross margin ≈ 88–92% [U].

## 6. Risks and answers
| Risk | Answer |
|---|---|
| Tax advice liability | "Educational estimates, not tax advice"; AI never produces tax numbers; "show math" with statute links |
| Data trust | no SSNs; masked provider TIN; private storage + RLS; one-tap delete |
| Seasonality | Gap Radar + Claim Vault carry the months between enrollment windows |
| Shrinking DCFSA pool (employers offering fell 65% → 54%, SHRM) | engine also optimises the credit and CTC; Gap Radar is useful without an FSA |
| Copycats (Nayya, administrators, TurboTax) | they are employer-bound or backward-looking; we are household-side and forward-looking |
