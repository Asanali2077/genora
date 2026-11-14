"use client";
import { createBrowserClient } from "@supabase/ssr";

let client: ReturnType<typeof createBrowserClient> | null = null;

export function getBrowserClient() {
  client ??= createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  return client;
}

/** Starts an anonymous session if the visitor has none, so a family can save a plan without signing up. */
export async function ensureSession(): Promise<void> {
  const sb = getBrowserClient();
  const { data } = await sb.auth.getSession();
  if (data.session) return;
  const { error } = await sb.auth.signInAnonymously();
  if (error) throw new Error(error.message);
}
