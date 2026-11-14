import "server-only";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import { getHousehold, isSubscribed } from "./household";

/** Loads the signed-in household for /app pages; sends visitors without one to onboarding. */
export async function requireHousehold() {
  const { sb, user } = await getUser();
  if (!user) redirect("/start");
  const household = await getHousehold(sb, user.id);
  if (!household) redirect("/start");
  const pro = await isSubscribed(sb, household.id);
  return { sb, user, household, pro };
}
