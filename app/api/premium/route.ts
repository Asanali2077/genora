import { hasPremium } from "@/lib/store";

export async function GET(req: Request) {
  const sessionId = new URL(req.url).searchParams.get("sessionId");
  if (!sessionId) return Response.json({ premium: false });
  return Response.json({ premium: await hasPremium(sessionId) });
}
