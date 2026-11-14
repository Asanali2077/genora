"use client";

import { Share2 } from "lucide-react";
import { track } from "@/lib/analytics";

const usd = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

/** Share what Genora found as an image card (native share sheet on phones). */
export function ShareFound({ amount }: { amount: number }) {
  async function share() {
    track("savings_card_shared");
    const card = `${window.location.origin}/api/card?found=${Math.round(amount)}`;
    try {
      if (navigator.share) await navigator.share({ title: "Genora", text: `Our family found ${usd(amount)} a year in childcare money with Genora.`, url: window.location.origin });
      else window.open(card, "_blank");
    } catch {}
  }
  return (
    <button type="button" onClick={share} className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-brand transition-colors hover:bg-brand/[0.07]">
      <Share2 className="size-4" aria-hidden />
      Share
    </button>
  );
}
