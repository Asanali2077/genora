import { z } from "zod";
import { getUser } from "@/lib/supabase/server";

const Body = z.object({ token: z.string().uuid() });

/** Adds the signed-in parent to the household behind an invite link (see 0003_partner_invite.sql). */
export async function POST(req: Request) {
  const { sb, user } = await getUser();
  if (!user) return Response.json({ error: "Your session expired. Reload the page to continue." }, { status: 401 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "This invite link is not valid." }, { status: 400 });
  const { data, error } = await sb.rpc("join_household", { token: parsed.data.token });
  if (error) {
    console.error("[join] failed", error.message);
    return Response.json({ error: "This invite link is not valid or has expired." }, { status: 400 });
  }
  return Response.json({ householdId: data });
}
