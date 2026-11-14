import { ProfileSchema } from "@/lib/domain/profile";
import { getUser } from "@/lib/supabase/server";
import { saveProfileAndPlan } from "@/lib/services/household";

/** Saves the onboarding profile for the signed-in (anonymous or email) user and returns the computed plan. */
export async function POST(req: Request) {
  const { sb, user } = await getUser();
  if (!user) return Response.json({ error: "Your session expired. Reload the page to continue." }, { status: 401 });

  const parsed = ProfileSchema.safeParse((await req.json().catch(() => null))?.profile);
  if (!parsed.success) return Response.json({ error: "Some answers are missing or out of range.", issues: parsed.error.issues }, { status: 400 });

  try {
    const { householdId, result } = await saveProfileAndPlan(sb, user.id, parsed.data);
    return Response.json({ householdId, foundMoney: result.foundMoney });
  } catch (err) {
    console.error("[household] save failed", err);
    return Response.json({ error: "We couldn't save your plan. Try again in a moment." }, { status: 500 });
  }
}
