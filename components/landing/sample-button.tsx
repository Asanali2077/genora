"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { SAMPLES, SAMPLE_CLOSURES, SAMPLE_LAST_DAY, SAMPLE_RECEIPT } from "@/config/samples";
import { ensureSession } from "@/lib/supabase/browser";
import { track } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** One click: saves a sample family (Garcia, CA) and opens their real plan, so anyone sees the value in seconds. */
export function SampleButton({ className, dark = false }: { className?: string; dark?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <Button
      size="lg"
      variant="ghost"
      disabled={busy}
      className={cn(dark && "text-white/85 hover:bg-white/10 hover:text-white", className)}
      onClick={async () => {
        setBusy(true);
        try {
          await ensureSession();
          const res = await fetch("/api/household", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ profile: SAMPLES[0].profile }) });
          if (!res.ok) throw new Error();
          const json = (body: unknown) => ({ method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
          // Fill the other sections too, so every screen shows real output for this family.
          await Promise.all([
            fetch("/api/coverage", json({ closures: SAMPLE_CLOSURES, lastDay: SAMPLE_LAST_DAY })),
            fetch("/api/receipts", json({ fields: SAMPLE_RECEIPT, source: "manual" })),
          ]).catch(() => {});
          track("sample_family_opened");
          router.refresh();
      router.push("/app/benefits");
        } catch {
          setBusy(false);
          router.push("/start");
        }
      }}
    >
      <Sparkles />
      {busy ? "Opening a sample family…" : "See a sample family"}
    </Button>
  );
}
