import type { Metadata } from "next";
import { Calculator, CalendarDays, Camera, Users } from "lucide-react";
import { pricing } from "@/config/site";
import { getUser } from "@/lib/supabase/server";
import { getHousehold, getLatestPlan } from "@/lib/services/household";
import { Checkout } from "@/components/pricing/checkout";
import { TrackView } from "@/components/track-view";

export const metadata: Metadata = { title: "Pricing — Genora" };
export const dynamic = "force-dynamic";

const ICONS = [Calculator, CalendarDays, Camera, Users];

export default async function PricingPage() {
  const { sb, user } = await getUser();
  const household = user ? await getHousehold(sb, user.id) : null;
  const plan = household ? await getLatestPlan(sb, household.id) : null;

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-10 px-4 pb-20 pt-10 md:grid-cols-[1fr_minmax(0,440px)] md:gap-14 md:pt-16">
      <TrackView name="paywall_view" />
      <div>
        <h1 className="text-[2.3rem] font-extrabold leading-[1.05] text-ink sm:text-5xl">{pricing.title}</h1>
        <p className="mt-4 text-lg text-muted-foreground">{pricing.sub}</p>
        <ul className="mt-8 space-y-5">
          {pricing.features.map((f, i) => {
            const Icon = ICONS[i] ?? Calculator;
            return (
              <li key={f} className="flex gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-[11px] bg-pine/[0.08] text-pine" aria-hidden>
                  <Icon className="size-5" />
                </span>
                <span className="pt-2 text-ink">{f}</span>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="md:pt-2">
        <Checkout hasHousehold={Boolean(household)} foundMoney={plan ? Number(plan.found_money) : null} />
      </div>
    </div>
  );
}
