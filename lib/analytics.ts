"use client";
import { getSessionId, getVariant } from "./session";

/** Событие воронки. Никогда не бросает исключений и не блокирует UI. */
export function track(name: string, props: Record<string, unknown> = {}): void {
  try {
    const body = JSON.stringify({ sessionId: getSessionId(), name, props, variant: getVariant() });
    void fetch("/api/events", { method: "POST", headers: { "content-type": "application/json" }, body, keepalive: true }).catch(() => {});
  } catch {}
}
