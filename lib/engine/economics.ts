import type { Economics } from "@/config/economics";

/** Subscription unit economics on a 3-year horizon. Formulas documented in docs/STRATEGY.md §5. */
export function unitEconomics(e: Economics) {
  const visitToPaid = e.visitToQuizStart * e.quizCompletion * e.revealToPaywall * e.paywallToPaid;
  const paidCac = visitToPaid > 0 ? e.cpc / visitToPaid : Infinity;
  const blendedCac = paidCac * (1 - e.organicShare);
  const annualLtv = e.annualPrice * (1 + e.annualRenewal1 + e.annualRenewal1 * e.annualRenewal2);
  const monthlyLtv = Math.min(36, 1 / e.monthlyChurn) * e.monthlyPrice;
  const ltv = (e.annualShare * annualLtv + (1 - e.annualShare) * monthlyLtv) * (1 - e.refundRate) * e.grossMargin;
  const arpu = e.annualShare * e.annualPrice + (1 - e.annualShare) * e.monthlyPrice * 12;
  return {
    visitToPaid,
    paidCac,
    blendedCac,
    ltv,
    ltvToCac: blendedCac > 0 ? ltv / blendedCac : Infinity,
    arpu,
    householdsFor100mArr: Math.ceil(100_000_000 / arpu),
  };
}
