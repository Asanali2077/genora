import type { Metadata } from "next";
import { pricing } from "@/config/site";
import { getUser } from "@/lib/supabase/server";
import { getHousehold, getLatestPlan } from "@/lib/services/household";
import { Checkout } from "@/components/pricing/checkout";
import { TrackView } from "@/components/track-view";

export const metadata: Metadata = { title: "Pricing — Genora" };
export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const { sb, user } = await getUser();
  const household = user ? await getHousehold(sb, user.id) : null;
  const plan = household ? await getLatestPlan(sb, household.id) : null;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-20 pt-10">
      <TrackView name="paywall_view" />
      <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl">{pricing.title}</h1>
      <p className="mt-3 text-lg text-muted-foreground">{pricing.sub}</p>
      <ul className="mt-6 space-y-2">
        {pricing.features.map((f) => (
          <li key={f} className="flex gap-3">
            <span className="mt-2 size-2 shrink-0 rounded-full bg-pine" aria-hidden />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <div className="mt-8">
        <Checkout hasHousehold={Boolean(household)} foundMoney={plan ? Number(plan.found_money) : null} />
      </div>
    </div>
  );
}
