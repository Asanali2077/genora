import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { adminToken } from "@/lib/admin-auth";

export async function POST(req: Request) {
  const { password } = (await req.json().catch(() => ({}))) as { password?: string };
  const expected = process.env.ADMIN_PASSWORD;
  const ok = Boolean(expected) && createHash("sha256").update(password ?? "").digest("hex") === createHash("sha256").update(expected!).digest("hex");
  if (!ok) return Response.json({ ok: false }, { status: 401 });
  (await cookies()).set("bc_admin", adminToken(), { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 12, secure: process.env.NODE_ENV === "production" });
  return Response.json({ ok: true });
}
