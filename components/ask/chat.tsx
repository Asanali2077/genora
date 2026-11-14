"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp } from "lucide-react";
import { Mark } from "@/components/brand/mark";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "assistant"; text: string };

export function AskChat({ suggestions, initialQuestion }: { suggestions: string[]; initialQuestion?: string }) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [follow, setFollow] = useState<string[]>(suggestions);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const asked = useRef(false);

  async function ask(q: string) {
    const question = q.trim();
    if (!question || busy) return;
    const history = msgs.slice(-6);
    setMsgs((m) => [...m, { role: "user", text: question }]);
    setInput("");
    setBusy(true);
    track("ask_genora", { length: question.length });
    try {
      const res = await fetch("/api/ask", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ question, history }) });
      const json = await res.json();
      setMsgs((m) => [...m, { role: "assistant", text: res.ok ? json.answer : json.error }]);
      if (res.ok && json.followUps?.length) setFollow(json.followUps);
    } catch {
      setMsgs((m) => [...m, { role: "assistant", text: "Genora can't answer right now. Try again in a moment." }]);
    } finally {
      setBusy(false);
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }), 50);
    }
  }

  // A question typed into the ⌘K menu arrives as ?q= and is asked once.
  useEffect(() => {
    if (!initialQuestion || asked.current) return;
    // The flag is set inside the timer so a cancelled first run (Strict Mode) doesn't block the real one.
    const id = setTimeout(() => {
      asked.current = true;
      void ask(initialQuestion);
    }, 0);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuestion]);

  return (
    <div className="panel flex min-h-[60vh] flex-col overflow-hidden">
      <div className="flex-1 space-y-4 p-5 sm:p-6" aria-live="polite">
        {msgs.length === 0 && (
          <div className="flex items-start gap-3">
            <Mark size={28} className="mt-1 shrink-0" />
            <p className="max-w-xl text-[15px] text-ink">Ask anything about your family&apos;s childcare money: the FSA, the credit, camps, school breaks or deadlines. I answer from your own numbers and the 2026 rules.</p>
          </div>
        )}
        <AnimatePresence initial={false}>
          {msgs.map((m, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={cn("flex gap-3", m.role === "user" && "justify-end")}>
              {m.role === "assistant" && <Mark size={28} className="mt-1 shrink-0" />}
              <p className={cn("max-w-xl whitespace-pre-wrap rounded-[16px] px-4 py-3 text-[15px] leading-relaxed", m.role === "user" ? "bg-brand text-white" : "bg-wash text-ink")}>{m.text}</p>
            </motion.div>
          ))}
        </AnimatePresence>
        {busy && (
          <div className="flex items-center gap-3">
            <Mark size={28} />
            <span className="flex gap-1 rounded-[16px] bg-wash px-4 py-4" aria-label="Genora is thinking">
              {[0, 1, 2].map((d) => (
                <motion.span key={d} className="size-2 rounded-full bg-brand" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: d * 0.2 }} />
              ))}
            </span>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="border-t border-ink/[0.07] bg-wash p-4 sm:p-5">
        <div className="mb-3 flex flex-wrap gap-2">
          {follow.map((s) => (
            <button key={s} type="button" disabled={busy} onClick={() => ask(s)} className="rounded-full border border-ink/15 bg-white px-3.5 py-1.5 text-sm text-ink transition-colors hover:border-brand hover:text-brand disabled:opacity-50">
              {s}
            </button>
          ))}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); void ask(input); }} className="field flex items-center gap-2 pr-1.5">
          <input value={input} onChange={(e) => setInput(e.target.value)} maxLength={500} placeholder="Can I pay for summer camp with my FSA?" aria-label="Your question" className="h-full flex-1 bg-transparent outline-none" />
          <button type="submit" disabled={busy || !input.trim()} aria-label="Send" className="flex size-9 items-center justify-center rounded-[9px] bg-brand text-white disabled:opacity-40"><ArrowUp className="size-[18px]" /></button>
        </form>
        <p className="mt-2 text-xs text-muted-foreground">Educational answers from your Genora numbers, not tax advice.</p>
      </div>
    </div>
  );
}
