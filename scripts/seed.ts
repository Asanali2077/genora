// npm run seed — заливает демо-воронку в Supabase (нужны ключи в .env.local). Идемпотентно: сперва чистит is_seed=true.
import { createClient } from "@supabase/supabase-js";
import { loadEnvConfig } from "@next/env";
import { generateSeed } from "../lib/seed";

loadEnvConfig(process.cwd());

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.log("Supabase не настроен — seed не нужен: /admin использует встроенные демо-данные.");
    return;
  }
  const sb = createClient(url, key, { auth: { persistSession: false } });
  await sb.from("events").delete().eq("is_seed", true);
  await sb.from("subscriptions").delete().eq("is_seed", true);
  const { events, subs } = generateSeed();
  for (let i = 0; i < events.length; i += 1000) {
    const { error } = await sb.from("events").insert(events.slice(i, i + 1000));
    if (error) throw error;
  }
  if (subs.length) {
    const { error } = await sb.from("subscriptions").insert(subs);
    if (error) throw error;
  }
  console.log(`seed OK: ${events.length} events, ${subs.length} subscriptions`);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
