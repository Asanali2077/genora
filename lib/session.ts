"use client";

/** Анонимный идентификатор посетителя (живёт в localStorage). Основа воронки и привязки результата. */
export function getSessionId(): string {
  try {
    let id = localStorage.getItem("bc_session");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("bc_session", id);
    }
    return id;
  } catch {
    return "anon";
  }
}

export function getVariant(): "a" | "b" {
  try {
    const q = new URLSearchParams(window.location.search).get("v");
    if (q === "a" || q === "b") {
      localStorage.setItem("bc_variant", q);
      return q;
    }
    const saved = localStorage.getItem("bc_variant");
    if (saved === "a" || saved === "b") return saved;
    const v = Math.random() < 0.5 ? "a" : "b";
    localStorage.setItem("bc_variant", v);
    return v;
  } catch {
    return "a";
  }
}
