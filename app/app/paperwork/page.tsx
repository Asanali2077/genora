import type { Metadata } from "next";
import { requireHousehold } from "@/lib/services/access";
import { getLatestPlan } from "@/lib/services/household";
import { listReceipts } from "@/lib/services/claims";
import { buildLetters } from "@/lib/engine/paperwork";
import { PageHeader } from "@/components/app/shell";
import { Letters } from "@/components/paperwork/letters";
import { Locked } from "@/components/app/locked";

export const metadata: Metadata = { title: "Paperwork — Genora" };
export const dynamic = "force-dynamic";

export default async function PaperworkPage() {
  const { sb, household, pro } = await requireHousehold();
  const [plan, receipts] = await Promise.all([getLatestPlan(sb, household.id), listReceipts(sb, household.id)]);
  const missingTin = [...new Set(receipts.filter((r) => !r.provider_tin_last4).map((r) => r.provider))];
  const letters = plan ? buildLetters(household.profile, plan.result, missingTin) : [];

  return (
    <>
      <PageHeader title="Letters & forms" sub="Letters written from your family's numbers: send them to HR and your childcare providers in one click." />
      <div className="px-5 py-8 md:px-10">
        {pro ? (
          <Letters letters={letters} />
        ) : (
          <Locked href="/app/paperwork" title="Let Genora write the paperwork" body="Open-enrollment elections for each parent, mid-year change requests and taxpayer ID requests to providers, filled in with your numbers." />
        )}
      </div>
    </>
  );
}
