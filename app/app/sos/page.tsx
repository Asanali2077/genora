import type { Metadata } from "next";
import { requireHousehold } from "@/lib/services/access";
import { getLatestCoverage } from "@/lib/services/coverage";
import { claimsSummary, listReceipts } from "@/lib/services/claims";
import { combinedTaxRate } from "@/lib/services/coverage";
import { valueBenefits } from "@/lib/engine/family";
import { PageHeader } from "@/components/app/shell";
import { SosPlanner } from "@/components/sos/sos-planner";

export const metadata: Metadata = { title: "Care SOS — Genora" };
export const dynamic = "force-dynamic";

export default async function SosPage() {
  const { sb, household } = await requireHousehold();
  const p = household.profile;
  const today = new Date().toISOString().slice(0, 10);
  const [{ result }, receipts] = await Promise.all([getLatestCoverage(sb, household.id), listReceipts(sb, household.id)]);
  const claims = claimsSummary(p, receipts, today);
  const working = p.filingStatus === "mfj" ? p.parents : p.parents.slice(0, 1);
  const parents = working.map((x) => ({ label: x.label, ptoLeft: Math.max(0, x.ptoDays - (result?.ptoUsed[x.label] ?? 0)) }));
  const kids = p.children.map((c, i) => c.name.trim() || `Child ${i + 1}`);

  return (
    <>
      <PageHeader title="Sick day plan" sub="Kid sick or school closed tomorrow? Every way to cover it, ranked by what it really costs, with the messages ready." />
      <div className="max-w-6xl px-5 py-8 md:px-10">
        <SosPlanner
          kids={kids}
          parents={parents}
          backupCareDaysLeft={valueBenefits(p.employerBenefits, 160).backupDays}
          sitterPerDay={160}
          combinedTaxRate={combinedTaxRate(p)}
          fsaRoomLeft={Math.max(0, claims.election - claims.logged)}
        />
      </div>
    </>
  );
}
