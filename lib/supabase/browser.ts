"use client";
import { createBrowserClient } from "@supabase/ssr";

/** Браузерный клиент (anon key). null, если Supabase не настроен. */
export function getBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createBrowserClient(url, key);
}

/** Анонимный гость: создаёт сессию, если её ещё нет. Ошибки не критичны для демо. */
export async function ensureGuest(): Promise<void> {
  try {
    const sb = getBrowserClient();
    if (!sb) return;
    const { data } = await sb.auth.getSession();
    if (!data.session) await sb.auth.signInAnonymously();
  } catch {
    /* демо работает и без auth: идентификатор — session_id */
  }
}

export async function sendMagicLink(email: string): Promise<{ ok: boolean; error?: string }> {
  const sb = getBrowserClient();
  if (!sb) return { ok: false, error: "supabase_not_configured" };
  const { error } = await sb.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${window.location.origin}/result` },
  });
  return error ? { ok: false, error: error.message } : { ok: true };
}
