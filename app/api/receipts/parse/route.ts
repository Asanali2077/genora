import { z } from "zod";
import { getUser } from "@/lib/supabase/server";
import { parseReceipt } from "@/lib/ai/tasks/receipt";

export const maxDuration = 60;

const Body = z
  .object({
    imageDataUrl: z.string().regex(/^data:image\/(jpeg|png|webp);base64,/).max(6_000_000).optional(),
    text: z.string().max(6_000).optional(),
  })
  .refine((b) => b.imageDataUrl || b.text, { message: "image or text required" });

/** Reads a receipt with AI and returns editable fields. Nothing is saved until the parent confirms. */
export async function POST(req: Request) {
  const { user } = await getUser();
  if (!user) return Response.json({ error: "Your session expired. Reload the page to continue." }, { status: 401 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Add a photo of the receipt or paste its text." }, { status: 400 });

  const ai = await parseReceipt(parsed.data);
  if (!ai.ok) return Response.json({ error: "We couldn't read this receipt. Fill in the fields by hand.", aiUnavailable: true }, { status: 422 });
  return Response.json({ fields: ai.data });
}
