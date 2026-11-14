"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Mail, MessageSquare } from "lucide-react";
import { careOptions } from "@/lib/engine/family";
import { track } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const usd = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
const REASONS = [
  { id: "sick", label: "Kid is sick", phrase: "is sick" },
  { id: "school", label: "School is closed", phrase: "has no school" },
  { id: "daycare", label: "Daycare is closed", phrase: "has no daycare" },
] as const;

type Props = {
  kids: string[];
  parents: { label: string; ptoLeft: number }[];
  backupCareDaysLeft: number;
  sitterPerDay: number;
  combinedTaxRate: number;
  fsaRoomLeft: number;
};

function Chips<T extends string | number>({ label, value, options, onChange }: { label: string; value: T; options: { v: T; t: string }[]; onChange: (v: T) => void }) {
  return (
    <div>
      <p className="text-sm font-semibold text-ink">{label}</p>
      <div role="radiogroup" aria-label={label} className="mt-2 flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={String(o.v)}
            type="button"
            role="radio"
            aria-checked={value === o.v}
            onClick={() => onChange(o.v)}
            className={cn("h-10 rounded-full border px-4 text-sm font-semibold transition-colors", value === o.v ? "border-pine bg-pine text-white" : "border-ink/15 bg-white text-ink hover:border-pine/50")}
          >
            {o.t}
          </button>
        ))}
      </div>
    </div>
  );
}

/** "My kid is sick tomorrow": every way to cover it, ranked by real cost, with the messages ready to send. */
export function SosPlanner(p: Props) {
  const [reason, setReason] = useState<(typeof REASONS)[number]["id"]>("sick");
  const [days, setDays] = useState(1);
  const [kid, setKid] = useState(p.kids[0] ?? "Our kid");

  const options = useMemo(
    () => careOptions({ days, kids: 1, parents: p.parents, backupCareDaysLeft: p.backupCareDaysLeft, sitterPerDay: p.sitterPerDay, combinedTaxRate: p.combinedTaxRate, fsaRoomLeft: p.fsaRoomLeft }),
    [days, p],
  );
  const best = options[0];
  const phrase = REASONS.find((r) => r.id === reason)!.phrase;
  const when = days === 1 ? "tomorrow" : `for the next ${days} days`;
  const partnerMsg = `${kid} ${phrase} ${when}. Plan: ${best.title.toLowerCase()}. ${best.afterTaxCost ? `Cost ${usd(best.afterTaxCost)} after FSA savings.` : "No extra cost."} OK?`;
  const managerMsg = `Hi — ${kid} ${phrase} ${when}, so I need to take ${days === 1 ? "the day" : `${days} days`} off to care for them. I'll stay reachable for anything urgent and catch up on my return. Thank you for understanding.`;

  return (
    <div className="grid gap-6 lg:grid-cols-[22rem_1fr]">
      <div className="panel space-y-5 self-start p-5 sm:p-6">
        <Chips label="What happened" value={reason} options={REASONS.map((r) => ({ v: r.id, t: r.label }))} onChange={(v) => { setReason(v); track("sos_used", { reason: v }); }} />
        {p.kids.length > 1 && <Chips label="Who" value={kid} options={p.kids.map((k) => ({ v: k, t: k }))} onChange={setKid} />}
        <Chips label="How long" value={days} options={[1, 2, 3, 5].map((d) => ({ v: d, t: d === 1 ? "1 day" : `${d} days` }))} onChange={setDays} />
      </div>

      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {options.map((o, i) => (
            <motion.div
              key={`${o.id}-${days}`}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: i * 0.06, duration: 0.3 }}
              className={cn("panel flex items-start justify-between gap-4 p-5", i === 0 && o.available && "ring-2 ring-pine", !o.available && "opacity-55")}
            >
              <div>
                <p className="flex flex-wrap items-center gap-2 font-semibold text-ink">
                  {o.title}
                  {i === 0 && o.available && <span className="rounded-full bg-pine px-2 py-0.5 text-[11px] font-bold text-white">Best option</span>}
                  {o.badge && <span className="rounded-full bg-marigold/25 px-2 py-0.5 text-[11px] font-bold text-ink">{o.badge}</span>}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{o.detail}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-heading text-xl font-bold text-ink tabular">{o.afterTaxCost ? usd(o.afterTaxCost) : "$0"}</p>
                {o.cashCost > o.afterTaxCost && <p className="text-xs text-muted-foreground line-through tabular">{usd(o.cashCost)}</p>}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        <div className="panel p-5 sm:p-6">
          <p className="font-heading text-lg font-bold text-ink">Messages, ready to send</p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="inset p-4 text-sm text-ink">
              <p className="mb-2 font-semibold">To your partner</p>
              <p>{partnerMsg}</p>
              <Button size="sm" className="mt-3" nativeButton={false} render={<a href={`sms:?&body=${encodeURIComponent(partnerMsg)}`} onClick={() => track("sos_message", { to: "partner" })} />}><MessageSquare />Text</Button>
            </div>
            <div className="inset p-4 text-sm text-ink">
              <p className="mb-2 font-semibold">To your manager</p>
              <p>{managerMsg}</p>
              <Button size="sm" variant="outline" className="mt-3" nativeButton={false} render={<a href={`mailto:?subject=${encodeURIComponent(`Out ${when}: family care`)}&body=${encodeURIComponent(managerMsg)}`} onClick={() => track("sos_message", { to: "manager" })} />}><Mail />Email</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
