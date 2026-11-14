"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ password }) });
    if (res.ok) router.refresh();
    else setError("Wrong password.");
  }

  return (
    <form onSubmit={submit} className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-4 px-4 py-16">
      <h1 className="text-2xl font-bold">Genora metrics</h1>
      <label className="text-sm font-semibold">
        Password
        <input type="password" value={password} onChange={(e) => { setPassword(e.target.value); setError(null); }} className="mt-2 h-12 w-full rounded-lg border bg-card px-3 text-base font-normal" />
      </label>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="tap h-12">Sign in</Button>
    </form>
  );
}
