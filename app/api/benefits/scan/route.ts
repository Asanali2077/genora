import { z } from "zod";
import { getUser } from "@/lib/supabase/server";
import { getHousehold } from "@/lib/services/household";
import { scanBenefitsGuide } from "@/lib/ai/tasks/benefits-guide";
import { EmployerBenefitSchema } from "@/lib/domain/profile";
import { valueBenefits } from "@/lib/engine/family";

export const maxDuration = 60;

const Scan = z
  .object({
    fileDataUrl: z.string().regex(/^data:(application\/pdf|image\/(jpeg|png|webp));base64,/).max(8_000_000).optional(),
    text: z.string().max(20_000).optional(),
  })
  .refine((b) => b.fileDataUrl || b.text, { message: "file or text required" });

/** AI reads the guide; the engine prices what it found. Nothing is saved until the parent confirms. */
export async function POST(req: Request) {
  const { user } = await getUser();
  if (!user) return Response.json({ error: "Your session expired. Reload the page to continue." }, { status: 401 });
  const parsed = Scan.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Upload a PDF of your benefits guide or paste its text." }, { status: 400 });
  const ai = await scanBenefitsGuide(parsed.data);
  if (!ai.ok) return Response.json({ error: "We couldn't read this guide. Try pasting the family-benefits section as text." }, { status: 422 });
  return Response.json({ ...valueBenefits(ai.data.benefits, 160) });
}

const Save = z.object({ benefits: z.array(EmployerBenefitSchema).max(25) });

export async function PUT(req: Request) {
  const { sb, user } = await getUser();
  if (!user) return Response.json({ error: "Your session expired." }, { status: 401 });
  const household = await getHousehold(sb, user.id);
  if (!household) return Response.json({ error: "Build your family plan first." }, { status: 404 });
  const parsed = Save.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid benefits." }, { status: 400 });
  const { error } = await sb.from("households").update({ profile: { ...household.profile, employerBenefits: parsed.data.benefits } }).eq("id", household.id);
  if (error) return Response.json({ error: "We couldn't save these benefits." }, { status: 500 });
  return Response.json({ ok: true });
}
