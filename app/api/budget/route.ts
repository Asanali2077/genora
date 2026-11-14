import { z } from "zod";
import { BudgetSchema } from "@/lib/domain/profile";
import { getUser } from "@/lib/supabase/server";
import { getHousehold } from "@/lib/services/household";

const Body = z.object({ budget: BudgetSchema });

/** Saves the family's budget inputs into the household profile (RLS limits the update to members). */
export async function PUT(req: Request) {
  const { sb, user } = await getUser();
  if (!user) return Response.json({ error: "Your session expired. Reload the page to continue." }, { status: 401 });
  const household = await getHousehold(sb, user.id);
  if (!household) return Response.json({ error: "Build your family plan first." }, { status: 404 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Check the amounts and try again." }, { status: 400 });
  const { error } = await sb.from("households").update({ profile: { ...household.profile, budget: parsed.data.budget } }).eq("id", household.id);
  if (error) return Response.json({ error: "We couldn't save your budget." }, { status: 500 });
  return Response.json({ ok: true });
}
