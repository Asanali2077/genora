import "server-only";
import { getAdminClient } from "./supabase/admin";

/**
 * Слой хранения. Supabase, если настроен; иначе in-memory (демо без ключей не ломается).
 * Все функции никогда не бросают исключений наружу — аналитика не должна валить UX.
 */
export type EventRow = { session_id: string; name: string; props?: Record<string, unknown>; variant?: string | null; created_at?: string; is_seed?: boolean };
export type SubRow = { session_id: string; plan_id: string; status: string; price: number; variant?: string | null; created_at?: string; is_seed?: boolean };
export type ResultRow = { share_id: string; session_id: string; result: unknown; locale: string; provider: string };

type Mem = { events: EventRow[]; subs: SubRow[]; results: ResultRow[]; quiz: Map<string, Record<string, unknown>> };
const g = globalThis as unknown as { __mem?: Mem };
const mem: Mem = (g.__mem ??= { events: [], subs: [], results: [], quiz: new Map() });

const rid = () => Math.random().toString(16).slice(2, 14);

export async function trackEvent(e: EventRow): Promise<void> {
  const row = { ...e, props: e.props ?? {}, created_at: e.created_at ?? new Date().toISOString() };
  mem.events.push(row);
  if (mem.events.length > 5000) mem.events.shift();
  try {
    await getAdminClient()?.from("events").insert(row);
  } catch {}
}

export async function saveQuiz(sessionId: string, answers: Record<string, unknown>, completed: boolean): Promise<void> {
  mem.quiz.set(sessionId, answers);
  try {
    await getAdminClient()
      ?.from("quiz_responses")
      .upsert({ session_id: sessionId, answers, completed, updated_at: new Date().toISOString() }, { onConflict: "session_id" });
  } catch {}
}

export async function saveResult(sessionId: string, result: unknown, locale: string, provider: string): Promise<string> {
  const shareId = rid();
  mem.results.push({ share_id: shareId, session_id: sessionId, result, locale, provider });
  try {
    await getAdminClient()?.from("ai_results").insert({ share_id: shareId, session_id: sessionId, result, locale, provider });
  } catch {}
  return shareId;
}

export async function getResultByShare(shareId: string): Promise<ResultRow | null> {
  const local = mem.results.find((r) => r.share_id === shareId);
  if (local) return local;
  try {
    const { data } = (await getAdminClient()?.from("ai_results").select("*").eq("share_id", shareId).maybeSingle()) ?? {};
    return (data as ResultRow) ?? null;
  } catch {
    return null;
  }
}

export async function saveSubscription(s: SubRow): Promise<void> {
  mem.subs.push({ ...s, created_at: new Date().toISOString() });
  try {
    await getAdminClient()?.from("subscriptions").insert(s);
  } catch {}
}

export async function hasPremium(sessionId: string): Promise<boolean> {
  if (mem.subs.some((s) => s.session_id === sessionId && s.status !== "canceled")) return true;
  try {
    const { data } = (await getAdminClient()?.from("subscriptions").select("id").eq("session_id", sessionId).neq("status", "canceled").limit(1)) ?? {};
    return Boolean(data && data.length);
  } catch {
    return false;
  }
}

export async function listEvents(): Promise<EventRow[]> {
  try {
    const sb = getAdminClient();
    if (sb) {
      const { data } = await sb.from("events").select("session_id,name,props,variant,created_at,is_seed").order("created_at", { ascending: false }).limit(20000);
      if (data) return data as EventRow[];
    }
  } catch {}
  return mem.events;
}

export async function listSubs(): Promise<SubRow[]> {
  try {
    const sb = getAdminClient();
    if (sb) {
      const { data } = await sb.from("subscriptions").select("session_id,plan_id,status,price,variant,created_at,is_seed").limit(20000);
      if (data) return data as SubRow[];
    }
  } catch {}
  return mem.subs;
}
