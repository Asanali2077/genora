import type { Metadata } from "next";
import { requireHousehold } from "@/lib/services/access";
import { getLatestCoverage } from "@/lib/services/coverage";
import { PageHeader } from "@/components/app/shell";
import { BudgetBoard } from "@/components/budget/budget-board";

export const metadata: Metadata = { title: "Budget forecast — Genora" };
export const dynamic = "force-dynamic";

export default async function BudgetPage() {
  const { sb, household, pro } = await requireHousehold();
  const { result } = await getLatestCoverage(sb, household.id);
  const today = new Date().toISOString().slice(0, 10);
  return (
    <>
      <PageHeader title="Budget forecast" sub="Your next 12 months with everything ordinary budgets miss: tax rules, benefits, school breaks, sick season, holidays and your kids' milestones." />
      <div className="max-w-7xl px-5 py-8 md:px-10">
        <BudgetBoard profile={household.profile} coverage={result?.assignments ?? []} ptoUsed={result?.ptoUsed ?? {}} today={today} pro={pro} />
      </div>
    </>
  );
}
