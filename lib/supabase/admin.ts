import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import WebSocket from "ws";

export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

let cached: SupabaseClient | null = null;

/** Серверный клиент с service_role. null, если ключи не заданы (тогда работает локальный fallback). */
export function getAdminClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  cached ??= createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
    // Node < 22 has no global WebSocket; supabase-js needs one to construct its realtime client.
    realtime: { transport: WebSocket as never },
  });
  return cached;
}
