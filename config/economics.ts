/**
 * Unit-economics assumptions (base case from docs/STRATEGY.md). Measured funnel conversion from
 * /admin replaces the assumed paywall conversion when there is enough real traffic.
 */
export const economics = {
  cpc: 1.0, // blended cost per click, USD (WordStream 2025 Meta traffic ≈ $0.70–1.92)
  visitToQuizStart: 0.55,
  quizCompletion: 0.7,
  revealToPaywall: 0.85,
  paywallToPaid: 0.07,
  organicShare: 0.3,
  annualShare: 0.6,
  annualPrice: 99,
  monthlyPrice: 12,
  annualRenewal1: 0.55,
  annualRenewal2: 0.6,
  monthlyChurn: 0.12,
  refundRate: 0.03,
  grossMargin: 0.9,
} as const;
export type Economics = { -readonly [K in keyof typeof economics]: number };
