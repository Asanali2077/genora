"use client";

import { useState } from "react";
import { Check, Copy, Mail } from "lucide-react";
import { track } from "@/lib/analytics";
import { Button } from "@/components/ui/button";

export function InviteCard({ link }: { link: string | null }) {
  const [copied, setCopied] = useState(false);
  if (!link) {
    return <p className="text-sm text-muted-foreground">Partner invites will appear here once the database update is applied.</p>;
  }
  const body = `I set up our family's childcare money plan on Genora. Join with this link so we can plan school breaks and claims together:\n\n${link}`;

  return (
    <div>
      <div className="field flex items-center gap-2 bg-[#fafcfb] text-sm">
        <span className="min-w-0 flex-1 truncate text-muted-foreground">{link}</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          onClick={async () => {
            await navigator.clipboard.writeText(link);
            setCopied(true);
            track("partner_invite_sent", { via: "copy" });
            setTimeout(() => setCopied(false), 1800);
          }}
        >
          {copied ? <Check /> : <Copy />}
          {copied ? "Link copied" : "Copy invite link"}
        </Button>
        <Button variant="outline" nativeButton={false} render={<a href={`mailto:?subject=${encodeURIComponent("Join our family plan on Genora")}&body=${encodeURIComponent(body)}`} onClick={() => track("partner_invite_sent", { via: "email" })} />}>
          <Mail />Send by email
        </Button>
      </div>
    </div>
  );
}
