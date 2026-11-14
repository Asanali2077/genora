import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import WebSocket from "ws";

/**
 * Supabase client acting as the signed-in user (anonymous or email): every query goes through RLS.
 * Cookie writes are ignored in Server Components (read-only there); Route Handlers can refresh the session.
 */
export const getServerClient = cache(async () => {
  const store = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          for (const { name, value, options } of list) store.set(name, value, options);
        } catch {
          // called from a Server Component: the browser client refreshes the session instead
        }
      },
    },
    // Node < 22 has no global WebSocket; supabase-js needs one to construct its realtime client.
    realtime: { transport: WebSocket as never },
  });
});

/**
 * The signed-in user for this request. getClaims verifies the session JWT locally with the project's signing keys
 * (no Auth round trip when asymmetric keys are enabled); cache() shares the result between layout and page.
 */
export const getUser = cache(async () => {
  const sb = await getServerClient();
  const { data } = await sb.auth.getClaims();
  const sub = data?.claims?.sub;
  return { sb, user: typeof sub === "string" ? { id: sub } : null };
});
