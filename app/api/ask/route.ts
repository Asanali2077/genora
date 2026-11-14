import { z } from "zod";
import { getUser } from "@/lib/supabase/server";
import { getHousehold } from "@/lib/services/household";
import { getLatestCoverage } from "@/lib/services/coverage";
import { claimsSummary, listReceipts } from "@/lib/services/claims";
import { analyzeBenefits } from "@/lib/engine/benefits";
import { lifeEvents } from "@/lib/engine/family";
import { TAX_YEAR } from "@/lib/engine/tax-2026";
import { callStructured } from "@/lib/ai";
import { guides } from "@/config/guides";

export const maxDuration = 60;

const Body = z.object({
  question: z.string().min(2).max(500),
  history: z.array(z.object({ role: z.enum(["user", "assistant"]), text: z.string().max(2_000) })).max(8).default([]),
});
const Answer = z.object({ answer: z.string().min(1).max(1_500), followUps: z.array(z.string().max(120)).max(3).default([]) });

const SYSTEM = [
  "You are Genora's family childcare-money assistant for a US parent. Answer in plain, warm English, at most 120 words.",
  "Use ONLY the FAMILY FACTS and RULES given. Every dollar figure you mention must appear in FAMILY FACTS; never calculate new tax numbers.",
  "If a question needs a number that is not in the facts, say which Genora section computes it (Benefits, School breaks, Claims, Care SOS, Paperwork).",
  "This is educational information, not tax advice; for edge cases suggest the plan administrator or a tax professional.",
  'Return ONLY JSON: {"answer": string, "followUps": [up to 3 short follow-up questions the parent might ask next]}.',
].join("\n");

export async function POST(req: Request) {
  const { sb, user } = await getUser();
  if (!user) return Response.json({ error: "Your session expired. Reload the page to continue." }, { status: 401 });
  const household = await getHousehold(sb, user.id);
  if (!household) return Response.json({ error: "Build your family plan first." }, { status: 404 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Ask a question in a sentence or two." }, { status: 400 });

  const p = household.profile;
  const today = new Date().toISOString().slice(0, 10);
  const r = analyzeBenefits(p);
  const [{ result: cov }, receipts] = await Promise.all([getLatestCoverage(sb, household.id), listReceipts(sb, household.id)]);
  const claims = claimsSummary(p, receipts, today);

  const facts = {
    today,
    taxYear: TAX_YEAR,
    filingStatus: p.filingStatus,
    state: p.state,
    parents: p.parents.map((x) => ({ name: x.label, pay: x.earnedIncome, employerOffersDependentCareFsa: x.employerOffersDcfsa, currentElection: x.currentElection, ptoDays: x.ptoDays })),
    kids: p.children.map((c, i) => ({ name: c.name || `Child ${i + 1}`, age: TAX_YEAR - c.birthYear })),
    childcarePerYear: p.childcare,
    benefitsPlan: {
      moneyBackToday: r.current.total,
      moneyBackBestPlan: r.optimal.total,
      foundMoney: r.foundMoney,
      bestElectionSplit: r.optimal.allocation,
      careCreditInBestPlan: r.optimal.careCredit,
      careCreditRate: r.optimal.careCreditRate,
      childTaxCredit: r.childTaxCredit,
      warnings: r.warnings.map((w) => w.message),
      nextActions: r.actions.map((a) => a.title),
    },
    schoolBreaks: cov ? { noSchoolWeekdays: cov.gapDays, cashCost: cov.cashCost, savedByPto: cov.savedByPto, ptoUsed: cov.ptoUsed } : "not planned yet",
    fsaClaims: claims.recommended ? "not enrolled yet" : { election: claims.election, claimed: claims.logged, atRisk: claims.forfeitRisk, deadline: claims.deadline },
    employerBenefits: p.employerBenefits,
    upcoming: lifeEvents(p, today, { gracePeriod: p.gracePeriod }).slice(0, 5),
  };
  const rules = guides.map((g) => `${g.title}\n${g.sections.map((s) => `${s.heading}: ${s.body.join(" ")}`).join("\n")}`).join("\n\n");
  const history = parsed.data.history.map((h) => `${h.role === "user" ? "Parent" : "Genora"}: ${h.text}`).join("\n");

  const ai = await callStructured({
    schema: Answer,
    system: SYSTEM,
    user: `FAMILY FACTS (JSON):\n${JSON.stringify(facts)}\n\nRULES:\n${rules}\n\n${history ? `CONVERSATION SO FAR:\n${history}\n\n` : ""}QUESTION: ${parsed.data.question}`,
  });
  if (!ai.ok) return Response.json({ error: "Genora can't answer right now. The numbers in Benefits, School breaks and Claims are always available." }, { status: 503 });
  return Response.json(ai.data);
}
