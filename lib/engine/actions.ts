/**
 * "What needs us": the family's next actions, ranked. Pure and deterministic.
 * Every action comes from a computed fact (an engine result or missing data), carries the money at stake
 * when there is one, and points to the screen where it gets done. Actions vanish once the fact changes.
 */

export type NextAction = {
  id: string;
  title: string;
  detail: string;
  href: string;
  impact: number; // dollars at stake this year, 0 when it is about setup
  due?: string; // ISO date
  urgency: "now" | "soon" | "setup";
  pro: boolean; // needs the paid plan
};

export type ActionInput = {
  today: string;
  pro: boolean;
  foundMoney: number; // extra money the best FSA/credit split brings vs today
  bestElection: number;
  electionParent?: string;
  hasBudget: boolean;
  shortfall: { months: number; buffer: number; label: string };
  claims: { recommended: boolean; forfeitRisk: number; deadline: string; daysToDeadline: number; missingTin: string[]; receipts: number };
  hasCalendar: boolean;
  uncoveredDays: number;
  scannedBenefits: number;
  twoParents: boolean;
  enrollmentOpen: boolean;
};

const RANK = { now: 0, soon: 1, setup: 2 } as const;
const usd = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

export function nextActions(i: ActionInput): NextAction[] {
  const year = i.today.slice(0, 4);
  const out: NextAction[] = [];

  if (i.hasBudget && i.shortfall.months > 0) {
    out.push({ id: "shortfall", title: `Set aside ${usd(i.shortfall.buffer)} before ${i.shortfall.label}`, detail: `Your balance dips below zero in ${i.shortfall.months} month${i.shortfall.months > 1 ? "s" : ""}. See which costs land there.`, href: "/app/budget", impact: i.shortfall.buffer, urgency: "now", pro: false });
  }
  if (i.foundMoney > 0 && i.bestElection > 0) {
    out.push({
      id: "elect",
      title: `Elect ${usd(i.bestElection)} in the Dependent Care FSA`,
      detail: `${i.electionParent ? `Through ${i.electionParent === "You" ? "your" : `${i.electionParent}'s`} employer. ` : ""}Worth ${usd(i.foundMoney)} more than you get back today.`,
      href: "/app/benefits",
      impact: i.foundMoney,
      due: i.enrollmentOpen ? `${year}-12-15` : undefined,
      urgency: i.enrollmentOpen ? "now" : "soon",
      pro: false,
    });
    out.push({ id: "hr-letter", title: "Send HR your FSA election", detail: "The email is written from your numbers. Copy, paste, send.", href: "/app/paperwork", impact: 0, urgency: "soon", pro: true });
  }
  if (!i.claims.recommended && i.claims.forfeitRisk > 0) {
    out.push({ id: "forfeit", title: `Claim ${usd(i.claims.forfeitRisk)} before ${fmt(i.claims.deadline)}`, detail: "FSA money you don't claim by the deadline is lost. Log the receipts you have.", href: "/app/claims", impact: i.claims.forfeitRisk, due: i.claims.deadline, urgency: i.claims.daysToDeadline <= 60 ? "now" : "soon", pro: true });
  }
  if (i.claims.missingTin.length > 0) {
    out.push({ id: "tin", title: `Ask ${i.claims.missingTin[0]} for their taxpayer ID`, detail: "You need it for Form 2441. The W-10 request is ready.", href: "/app/paperwork", impact: 0, urgency: "soon", pro: true });
  }
  if (i.hasCalendar && i.uncoveredDays > 0) {
    out.push({ id: "gaps", title: `Book care for ${i.uncoveredDays} no-school day${i.uncoveredDays > 1 ? "s" : ""}`, detail: "In the next 60 days. Book camp or a sitter early — FSA-eligible, so it costs less after tax.", href: "/app/coverage", impact: 0, urgency: "soon", pro: true });
  }
  if (!i.hasBudget) out.push({ id: "bills", title: "Add your monthly bills", detail: "Two minutes. Then Genora shows every month of the year, including the tight ones.", href: "/app/budget", impact: 0, urgency: "setup", pro: false });
  if (!i.hasCalendar) out.push({ id: "calendar", title: "Paste the school calendar", detail: "AI finds every closure; Genora plans PTO and camps around them.", href: "/app/coverage", impact: 0, urgency: "setup", pro: true });
  if (i.scannedBenefits === 0) out.push({ id: "scan", title: "Scan your employer benefits guide", detail: "Backup care and employer FSA money are often buried in the PDF.", href: "/app/benefits#employer", impact: 0, urgency: "setup", pro: false });
  if (i.claims.receipts === 0 && !i.claims.recommended) out.push({ id: "receipt", title: "Log your first childcare receipt", detail: "A photo is enough.", href: "/app/claims", impact: 0, urgency: "setup", pro: true });
  if (i.twoParents && i.pro) out.push({ id: "partner", title: "Invite your partner", detail: "One plan, two phones. They see the same numbers.", href: "/app/family", impact: 0, urgency: "setup", pro: false });

  return out.sort((a, b) => RANK[a.urgency] - RANK[b.urgency] || b.impact - a.impact);
}

function fmt(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}
