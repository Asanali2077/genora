import { timingSafeEqual, createHash } from "node:crypto";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, adminToken } from "@/lib/services/admin";

export async function POST(req: Request) {
  const { password } = ((await req.json().catch(() => ({}))) ?? {}) as { password?: string };
  const expected = process.env.ADMIN_PASSWORD;
  const hash = (s: string) => createHash("sha256").update(s).digest();
  if (!expected || !password || !timingSafeEqual(hash(password), hash(expected))) {
    return Response.json({ error: "Wrong password." }, { status: 401 });
  }
  (await cookies()).set(ADMIN_COOKIE, adminToken(), { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 12, secure: process.env.NODE_ENV === "production" });
  return Response.json({ ok: true });
}
