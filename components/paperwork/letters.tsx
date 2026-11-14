"use client";

import { useState } from "react";
import { Check, Copy, Download, Mail } from "lucide-react";
import type { Letter } from "@/lib/engine/paperwork";
import { track } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Letters({ letters }: { letters: Letter[] }) {
  const [openId, setOpenId] = useState(letters[0]?.id);
  const [copied, setCopied] = useState<string | null>(null);
  const open = letters.find((l) => l.id === openId) ?? letters[0];
  if (!open) return null;

  async function copy(l: Letter) {
    await navigator.clipboard.writeText(`Subject: ${l.subject}\n\n${l.body}`);
    setCopied(l.id);
    track("letter_copied", { id: l.id });
    setTimeout(() => setCopied(null), 1800);
  }
  function download(l: Letter) {
    const blob = new Blob([`Subject: ${l.subject}\n\n${l.body}\n`], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${l.id}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[18rem_1fr]">
      <ul className="panel ledger self-start overflow-hidden" aria-label="Letters">
        {letters.map((l) => (
          <li key={l.id}>
            <button
              type="button"
              onClick={() => setOpenId(l.id)}
              aria-current={l.id === open.id}
              className={cn("w-full px-4 py-3.5 text-left transition-colors", l.id === open.id ? "bg-brand/[0.07]" : "hover:bg-ink/[0.03]")}
            >
              <span className={cn("block text-sm font-semibold", l.id === open.id ? "text-brand" : "text-ink")}>{l.title}</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">{l.when}</span>
            </button>
          </li>
        ))}
      </ul>

      <article className="panel overflow-hidden">
        <header className="border-b border-ink/[0.07] px-5 py-4 sm:px-6">
          <dl className="grid grid-cols-[4.5rem_1fr] gap-y-1 text-sm">
            <dt className="text-muted-foreground">To</dt>
            <dd className="font-medium text-ink">{open.to}</dd>
            <dt className="text-muted-foreground">Subject</dt>
            <dd className="font-medium text-ink">{open.subject}</dd>
          </dl>
        </header>
        <pre className="whitespace-pre-wrap px-5 py-5 font-sans text-[15px] leading-relaxed text-ink sm:px-6">{open.body}</pre>
        <footer className="flex flex-wrap gap-2 border-t border-ink/[0.07] bg-wash px-5 py-4 sm:px-6">
          <Button onClick={() => copy(open)}>{copied === open.id ? <Check /> : <Copy />}{copied === open.id ? "Copied" : "Copy letter"}</Button>
          <Button variant="outline" nativeButton={false} render={<a href={`mailto:?subject=${encodeURIComponent(open.subject)}&body=${encodeURIComponent(open.body)}`} />}>
            <Mail />Open in email
          </Button>
          <Button variant="ghost" onClick={() => download(open)}><Download />Download</Button>
        </footer>
      </article>
    </div>
  );
}
