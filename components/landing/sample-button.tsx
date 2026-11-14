"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { SAMPLES } from "@/config/samples";
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
          track("sample_family_opened");
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
