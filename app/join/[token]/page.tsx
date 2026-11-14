"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { ensureSession } from "@/lib/supabase/browser";
import { track } from "@/lib/analytics";
import { Mark } from "@/components/brand/mark";
import { Button } from "@/components/ui/button";

export default function JoinPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function join() {
    setBusy(true);
    setError(null);
    try {
      await ensureSession();
      const res = await fetch("/api/household/join", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      track("partner_joined");
      router.refresh();
      router.push("/app");
    } catch (e) {
      setError(e instanceof Error ? e.message : "We couldn't add you to this family.");
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-16">
      <div className="panel p-7">
        <Mark size={40} />
        <h1 className="mt-5 font-heading text-3xl font-bold tracking-[-0.025em] text-ink">You&apos;re invited to your family&apos;s Genora plan</h1>
        <p className="mt-3 text-muted-foreground">
          See the childcare benefits plan, add your PTO to the school-break calendar and log receipts together. Your partner&apos;s subscription covers you.
        </p>
        {error && <p role="alert" className="mt-4 rounded-[10px] bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
        <Button size="lg" className="mt-6 w-full" disabled={busy} onClick={join}>{busy ? "Joining…" : "Join my family"}</Button>
      </div>
    </div>
  );
}
