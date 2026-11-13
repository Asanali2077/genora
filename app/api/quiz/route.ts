import { z } from "zod";
import { saveQuiz } from "@/lib/store";

const Body = z.object({
  sessionId: z.string().min(1).max(100),
  answers: z.record(z.string(), z.unknown()),
  completed: z.boolean().default(false),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ ok: false }, { status: 400 });
  await saveQuiz(parsed.data.sessionId, parsed.data.answers, parsed.data.completed);
  return Response.json({ ok: true });
}
