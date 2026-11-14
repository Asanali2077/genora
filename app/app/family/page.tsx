import Link from "next/link";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { Pencil } from "lucide-react";
import { requireHousehold } from "@/lib/services/access";
import { TAX_YEAR } from "@/lib/engine/tax-2026";
import { PageHeader } from "@/components/app/shell";
import { InviteCard } from "@/components/family/invite";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Family — Genora" };
export const dynamic = "force-dynamic";

const usd = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
const CARE: Record<string, string> = { daycare: "Daycare", preschool: "Preschool", after_school: "Before / after-school", nanny: "Nanny or sitter", day_camp: "Day camps", overnight_camp: "Overnight camps" };
const STATUS: Record<string, string> = { mfj: "Married, filing jointly", hoh: "Head of household", single: "Single" };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="panel overflow-hidden">
      <h2 className="border-b border-ink/[0.07] px-5 py-4 font-heading text-lg font-bold text-ink sm:px-6">{title}</h2>
      <div className="px-5 py-5 sm:px-6">{children}</div>
    </section>
  );
}

export default async function FamilyPage() {
  const { sb, household } = await requireHousehold();
  const p = household.profile;
  const [{ data: members }, { data: invite }] = await Promise.all([
    sb.from("household_members").select("role, created_at").eq("household_id", household.id),
    sb.from("households").select("invite_token").eq("id", household.id).maybeSingle(),
  ]);
  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;
  const token = (invite as { invite_token?: string } | null)?.invite_token;
  const parents = p.filingStatus === "mfj" ? p.parents : p.parents.slice(0, 1);
  const care = Object.entries(p.childcare).filter(([, v]) => v > 0);


  return (
    <>
      <PageHeader
        title="Your family"
        sub={`${STATUS[p.filingStatus]} · ${p.state} · ${TAX_YEAR} plan year`}
        action={<Button variant="outline" nativeButton={false} render={<Link href="/start" />}><Pencil />Edit details</Button>}
      />
      <div className="grid gap-6 xl:grid-cols-2">
        <Section title="Parents">
          <ul className="space-y-4">
            {parents.map((x) => (
              <li key={x.label} className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-ink">{x.label === "You" ? "You" : x.label}</p>
                  <p className="text-sm text-muted-foreground">
                    {x.employerOffersDcfsa ? `Employer offers a Dependent Care FSA · elected ${usd(x.currentElection)}` : "No Dependent Care FSA at work"} · {x.ptoDays} PTO days
                  </p>
                </div>
                <p className="font-heading text-lg font-bold text-ink tabular">{usd(x.earnedIncome)}</p>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Kids">
          <ul className="space-y-3">
            {p.children.map((c, i) => {
              const age = TAX_YEAR - c.birthYear;
              return (
                <li key={i} className="flex items-center justify-between">
                  <span className="font-semibold text-ink">Child {i + 1}</span>
                  <span className="text-sm text-muted-foreground">
                    Born {c.birthYear} · {age < 13 ? "eligible for care benefits" : "13+, no care benefits"}{age < 17 ? " · Child Tax Credit" : ""}
                  </span>
                </li>
              );
            })}
          </ul>
        </Section>

        <Section title="Childcare this year">
          {care.length ? (
            <ul className="ledger -my-2">
              {care.map(([k, v]) => (
                <li key={k} className="flex justify-between py-2.5">
                  <span className="text-ink">{CARE[k]}</span>
                  <span className="font-semibold text-ink tabular">{usd(v)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No childcare costs entered. <Link href="/start" className="font-semibold text-brand">Add them</Link> to get a benefits plan.</p>
          )}
        </Section>

        <Section title="Invite your partner">
          <p className="mb-4 text-sm text-muted-foreground">
            {(members?.length ?? 1) > 1 ? `${members!.length} parents share this plan.` : "Share the plan: your partner sees the same numbers, adds their PTO and logs receipts. No extra cost."}
          </p>
          <InviteCard link={token ? `${origin}/join/${token}` : null} />
        </Section>
      </div>
    </>
  );
}
