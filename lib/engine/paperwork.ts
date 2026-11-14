/**
 * Paperwork generator: ready-to-send letters built from the family's own numbers.
 * Deterministic templates (no AI): every figure comes from the engine result.
 */
import type { Profile } from "@/lib/domain/profile";
import type { BenefitsResult } from "./benefits";
import { DCFSA_HOUSEHOLD_LIMIT, TAX_YEAR } from "./tax-2026";

export type Letter = { id: string; title: string; when: string; to: string; subject: string; body: string };

const usd = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

export function buildLetters(profile: Profile, result: BenefitsResult, providers: string[] = []): Letter[] {
  const letters: Letter[] = [];
  const nextYear = TAX_YEAR + 1;

  for (const a of result.optimal.allocation.filter((x) => x.election > 0)) {
    const parent = profile.parents.find((p) => p.label === a.parent);
    const otherAlloc = result.optimal.allocation.find((x) => x.parent !== a.parent && x.election > 0);
    letters.push({
      id: `enroll-${a.parent}`,
      title: `Open enrollment election for ${a.parent === "You" ? "you" : a.parent}`,
      when: "Open enrollment (usually Nov–Dec)",
      to: `${a.parent === "You" ? "Your" : `${a.parent}'s`} HR / benefits team`,
      subject: `Dependent Care FSA election for ${nextYear}`,
      body: [
        "Hello,",
        "",
        `I would like to enroll in the Dependent Care FSA for the ${nextYear} plan year with an annual election of ${usd(a.election)}.`,
        "",
        `For your records: our household limit is ${usd(DCFSA_HOUSEHOLD_LIMIT)} under IRC §129.${otherAlloc ? ` My spouse will elect ${usd(otherAlloc.election)} through their employer, so our combined elections stay within the household limit.` : profile.filingStatus === "mfj" ? " My spouse will not elect a Dependent Care FSA through their employer." : ""}`,
        "",
        "Could you confirm the per-paycheck deduction, the claim deadline and whether the plan offers a grace period?",
        "",
        "Thank you,",
        parent?.label === "You" ? "[Your name]" : `[${parent?.label ?? "Name"}]`,
      ].join("\n"),
    });
  }

  if (result.optimal.election !== result.current.election && result.current.election > 0) {
    letters.push({
      id: "midyear",
      title: "Mid-year election change",
      when: "Within 30 days of a change in provider, hours or cost",
      to: "HR / benefits team",
      subject: "Request to change my Dependent Care FSA election (qualifying change)",
      body: [
        "Hello,",
        "",
        `Our childcare arrangement has changed (new provider / change in hours / cost increase by a non-relative provider, effective [date]). Under Treas. Reg. §1.125-4(f), I would like to change my Dependent Care FSA election from ${usd(result.current.election)} to ${usd(result.optimal.election)} for the rest of the ${TAX_YEAR} plan year.`,
        "",
        "Please let me know which form or documentation you need from me.",
        "",
        "Thank you,",
        "[Your name]",
      ].join("\n"),
    });
  }

  for (const provider of providers.length ? providers : ["[Provider name]"]) {
    letters.push({
      id: `w10-${provider}`,
      title: `Taxpayer ID request: ${provider}`,
      when: "Before you file a claim or your tax return",
      to: provider,
      subject: "Request for Form W-10 (taxpayer ID) for childcare payments",
      body: [
        "Hi,",
        "",
        `Could you please send a completed IRS Form W-10 (or your name, address and taxpayer ID) for the childcare we paid in ${TAX_YEAR}? We need it for our Dependent Care FSA claims and Form 2441.`,
        "",
        "Form W-10: https://www.irs.gov/forms-pubs/about-form-w-10",
        "",
        "Thank you so much for caring for our family,",
        "[Your name]",
      ].join("\n"),
    });
  }

  return letters;
}
