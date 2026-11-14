import type { Metadata } from "next";
import { requireHousehold } from "@/lib/services/access";
import { Locked } from "@/components/app/locked";
import { PageHeader } from "@/components/app/shell";
import { claimsSummary, listReceipts } from "@/lib/services/claims";
import { Vault } from "@/components/claims/vault";

export const metadata: Metadata = { title: "Claim vault — Genora" };
export const dynamic = "force-dynamic";

export default async function ClaimsPage() {
  const { sb, household, pro } = await requireHousehold();
  const receipts = await listReceipts(sb, household.id);
  const { recommended, ...summary } = claimsSummary(household.profile, receipts, new Date().toISOString().slice(0, 10));

  return (
    <>
      <PageHeader title="Claims" sub="Every childcare payment you log brings FSA money back. Genora tracks it and warns you before anything is forfeited." />
      <div className="max-w-4xl px-5 py-8 md:px-10">
        {pro ? (
          <Vault summary={summary} receipts={receipts} recommended={recommended} />
        ) : (
          <Locked title="Stop forfeiting FSA money" body="Snap receipts, track every dollar your FSA owes you, and get warned before the deadline. Included in the Genora plan." />
        )}
      </div>
    </>
  );
}
