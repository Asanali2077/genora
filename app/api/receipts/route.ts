import { z } from "zod";
import { getUser } from "@/lib/supabase/server";
import { getHousehold } from "@/lib/services/household";
import { ReceiptFieldsSchema } from "@/lib/ai/tasks/receipt";

const Body = z.object({
  fields: ReceiptFieldsSchema.refine((f) => f.serviceTo >= f.serviceFrom, { message: "end date before start date" }),
  source: z.enum(["manual", "ai"]).default("manual"),
  imageDataUrl: z.string().regex(/^data:image\/(jpeg|png|webp);base64,/).max(6_000_000).optional(),
});

/** Saves a confirmed receipt. Overnight camp is stored but marked ineligible (Pub 503). */
export async function POST(req: Request) {
  const { sb, user } = await getUser();
  if (!user) return Response.json({ error: "Your session expired. Reload the page to continue." }, { status: 401 });
  const household = await getHousehold(sb, user.id);
  if (!household) return Response.json({ error: "Build your family plan first." }, { status: 404 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Check the provider, amount and dates." }, { status: 400 });
  const { fields, source, imageDataUrl } = parsed.data;

  let filePath: string | null = null;
  if (imageDataUrl) {
    const [meta, b64] = imageDataUrl.split(",");
    const ext = meta.includes("png") ? "png" : meta.includes("webp") ? "webp" : "jpg";
    filePath = `${household.id}/${crypto.randomUUID()}.${ext}`;
    const up = await sb.storage.from("receipts").upload(filePath, Buffer.from(b64, "base64"), { contentType: `image/${ext === "jpg" ? "jpeg" : ext}` });
    if (up.error) {
      console.error("[receipts] upload failed", up.error.message);
      filePath = null; // the claim is still useful without the image
    }
  }

  const { error } = await sb.from("receipts").insert({
    household_id: household.id,
    provider: fields.provider,
    category: fields.category,
    amount: fields.amount,
    service_from: fields.serviceFrom,
    service_to: fields.serviceTo,
    provider_tin_last4: fields.providerTinLast4,
    eligible: fields.category !== "overnight_camp" && fields.category !== "other",
    source,
    file_path: filePath,
  });
  if (error) {
    console.error("[receipts] insert failed", error.message);
    return Response.json({ error: "We couldn't save this receipt. Try again." }, { status: 500 });
  }
  return Response.json({ ok: true });
}

const Patch = z.object({ id: z.string().uuid(), status: z.enum(["logged", "claimed", "reimbursed"]) });

export async function PATCH(req: Request) {
  const { sb, user } = await getUser();
  if (!user) return Response.json({ error: "Your session expired." }, { status: 401 });
  const parsed = Patch.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid update." }, { status: 400 });
  const { error } = await sb.from("receipts").update({ status: parsed.data.status }).eq("id", parsed.data.id);
  if (error) return Response.json({ error: "We couldn't update this receipt." }, { status: 500 });
  return Response.json({ ok: true });
}

export async function DELETE(req: Request) {
  const { sb, user } = await getUser();
  if (!user) return Response.json({ error: "Your session expired." }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id");
  if (!id || !z.string().uuid().safeParse(id).success) return Response.json({ error: "Invalid receipt." }, { status: 400 });
  const { data } = await sb.from("receipts").select("file_path").eq("id", id).maybeSingle();
  if (data?.file_path) await sb.storage.from("receipts").remove([data.file_path]);
  const { error } = await sb.from("receipts").delete().eq("id", id);
  if (error) return Response.json({ error: "We couldn't delete this receipt." }, { status: 500 });
  return Response.json({ ok: true });
}
