"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { FileSearch, Upload } from "lucide-react";
import type { EmployerBenefit } from "@/lib/domain/profile";
import { track } from "@/lib/analytics";
import { Button } from "@/components/ui/button";

type Row = EmployerBenefit & { value: number };
const usd = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
const KIND: Record<EmployerBenefit["kind"], string> = {
  backup_care: "Backup care",
  childcare_subsidy: "Childcare subsidy",
  dcfsa_contribution: "Employer FSA contribution",
  dependent_care_fsa: "Dependent Care FSA",
  other: "Family benefit",
};

async function toDataUrl(file: File) {
  return new Promise<string>((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result));
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

/** Upload the HR benefits guide; AI lists family benefits, the engine prices them, the parent saves them to the plan. */
export function BenefitsScanner({ saved, sample }: { saved: Row[]; sample: string }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<Row[] | null>(saved.length ? saved : null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const total = (rows ?? []).reduce((s, r) => s + r.value, 0);

  async function scan(payload: { fileDataUrl?: string; text?: string }) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/benefits/scan", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setRows(json.rows);
      setDirty(true);
      track("benefits_scanned", { found: json.total, count: json.rows.length });
    } catch (e) {
      setError(e instanceof Error ? e.message : "We couldn't read this guide.");
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    if (!rows) return;
    setBusy(true);
    const benefits = rows.map((r) => ({ name: r.name, kind: r.kind, days: r.days, amount: r.amount, detail: r.detail }));
    const res = await fetch("/api/benefits/scan", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ benefits }) });
    setBusy(false);
    if (res.ok) {
      setDirty(false);
      router.refresh();
    } else setError("We couldn't save these benefits.");
  }

  return (
    <section aria-labelledby="scanner" className="panel overflow-hidden">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-ink/[0.07] px-5 py-4 sm:px-6">
        <div>
          <h2 id="scanner" className="font-heading text-lg font-bold text-ink">Benefits your employer already pays for</h2>
          <p className="text-sm text-muted-foreground">Upload the HR benefits guide. AI finds every family benefit; Genora prices it.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf,image/*"
            className="sr-only"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (f) void scan({ fileDataUrl: await toDataUrl(f) });
            }}
          />
          <Button disabled={busy} onClick={() => fileRef.current?.click()}><Upload />{busy ? "Reading…" : "Upload guide (PDF)"}</Button>
          <Button variant="outline" disabled={busy} onClick={() => scan({ text: sample })}><FileSearch />Try a sample guide</Button>
        </div>
      </header>

      {error && <p role="alert" className="mx-5 mt-4 rounded-[10px] bg-destructive/10 p-3 text-sm text-destructive sm:mx-6">{error}</p>}

      <AnimatePresence>
        {busy && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-5 py-6 sm:px-6">
            <div className="h-2 overflow-hidden rounded-full bg-[#eef3f1]">
              <motion.div className="h-full w-1/3 rounded-full bg-pine" animate={{ x: ["-100%", "300%"] }} transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }} />
            </div>
            <p className="mt-3 text-sm text-muted-foreground">Reading every page for childcare, backup care and FSA benefits…</p>
          </motion.div>
        )}
      </AnimatePresence>

      {rows && !busy && (
        <div className="px-5 py-5 sm:px-6">
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No family benefits found in this document.</p>
          ) : (
            <>
              <p className="font-heading text-2xl font-bold text-ink">
                Found <span className="marker tabular">{usd(total)}</span> a year in benefits
              </p>
              <ul className="ledger mt-4">
                {rows.map((r, i) => (
                  <motion.li key={`${r.name}-${i}`} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }} className="flex items-start justify-between gap-4 py-3">
                    <div>
                      <p className="font-semibold text-ink">{r.name}</p>
                      <p className="text-sm text-muted-foreground">{KIND[r.kind]}{r.days ? ` · ${r.days} days a year` : ""} · {r.detail}</p>
                    </div>
                    <span className="shrink-0 font-heading font-bold text-ink tabular">{r.value ? usd(r.value) : "—"}</span>
                  </motion.li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-muted-foreground">Backup care valued at $160 a day of care you won&apos;t have to buy. Cash benefits at the amount stated in the guide.</p>
              {dirty && <Button className="mt-4" disabled={busy} onClick={save}>Add to my plan</Button>}
            </>
          )}
        </div>
      )}
    </section>
  );
}
