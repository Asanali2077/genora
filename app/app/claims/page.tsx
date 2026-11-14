import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getUser } from "@/lib/supabase/server";
import { getHousehold } from "@/lib/services/household";
import { claimsSummary, listReceipts } from "@/lib/services/claims";
import { Vault } from "@/components/claims/vault";

export const metadata: Metadata = { title: "Claim vault — Genora" };
export const dynamic = "force-dynamic";

export default async function ClaimsPage() {
  const { sb, user } = await getUser();
  if (!user) redirect("/start");
  const household = await getHousehold(sb, user.id);
  if (!household) redirect("/start");
  const receipts = await listReceipts(sb, household.id);
  const { recommended, ...summary } = claimsSummary(household.profile, receipts, new Date().toISOString().slice(0, 10));

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-20 pt-8">
      <h1 className="text-3xl font-extrabold leading-tight sm:text-4xl">Claim vault</h1>
      <p className="mt-3 max-w-xl text-muted-foreground">Every childcare payment you log brings FSA money back. Genora tracks what you&apos;ve claimed and warns you before anything is forfeited.</p>
      <div className="mt-8"><Vault summary={summary} receipts={receipts} recommended={recommended} /></div>
    </div>
  );
}
