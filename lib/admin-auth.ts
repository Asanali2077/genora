import "server-only";
import { createHash } from "node:crypto";
import { cookies } from "next/headers";

export function adminToken(): string {
  return createHash("sha256").update(`bc-admin:${process.env.ADMIN_PASSWORD ?? ""}`).digest("hex");
}

export async function isAdmin(): Promise<boolean> {
  if (!process.env.ADMIN_PASSWORD) return false;
  return (await cookies()).get("bc_admin")?.value === adminToken();
}
