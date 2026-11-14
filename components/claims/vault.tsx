"use client";

import { useRef, useState } from "react";
import { Camera, Printer } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ClaimsResult } from "@/lib/engine/claims";
import type { StoredReceipt } from "@/lib/services/claims";
import { track } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { MoneyInput } from "@/components/onboarding/fields";
import { UsageRing } from "./usage-ring";

const usd = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
const fmt = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
const CATEGORIES = [
  ["daycare", "Daycare"],
  ["preschool", "Preschool"],
  ["after_school", "Before / after-school"],
  ["nanny", "Nanny / sitter"],
  ["day_camp", "Day camp"],
  ["overnight_camp", "Overnight camp (not eligible)"],
  ["other", "Other (not eligible)"],
] as const;
const STATUS_NEXT = { logged: { to: "claimed", label: "Mark submitted" }, claimed: { to: "reimbursed", label: "Mark reimbursed" }, reimbursed: null } as const;
const STATUS_LABEL = { logged: "Waiting to submit", claimed: "Submitted", reimbursed: "Reimbursed" } as const;

type Fields = { provider: string; category: string; amount: number; serviceFrom: string; serviceTo: string; providerTinLast4: string | null };

async function compress(file: File): Promise<string> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * scale);
  c.height = Math.round(bmp.height * scale);
  c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
  return c.toDataURL("image/jpeg", 0.82);
}

function PaceBar({ s }: { s: ClaimsResult }) {
  const total = Math.max(s.election, s.logged, 1);
  const future = Math.max(0, Math.min(s.election, s.projectedClaims) - s.logged);
  const seg = (v: number) => `${(Math.max(0, v) / total) * 100}%`;
  return (
    <div>
      <div className="flex h-5 overflow-hidden rounded-md bg-muted" role="img" aria-label={`${usd(s.logged)} of ${usd(s.election)} used, ${usd(s.forfeitRisk)} at risk`}>
        <span className="bg-brand" style={{ width: seg(s.reimbursed) }} />
        <span className="bg-brand/55" style={{ width: seg(s.submitted) }} />
        <span className="bg-sun" style={{ width: seg(s.waiting) }} />
        <span style={{ width: seg(future), backgroundImage: "repeating-linear-gradient(45deg, var(--brand) 0 2px, transparent 2px 7px)", opacity: 0.35 }} />
        <span className="bg-destructive/15 outline outline-1 -outline-offset-1 outline-destructive/50" style={{ width: seg(s.forfeitRisk) }} />
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
        <li><span className="mr-1.5 inline-block size-2.5 rounded-sm bg-brand" />Reimbursed {usd(s.reimbursed)}</li>
        <li><span className="mr-1.5 inline-block size-2.5 rounded-sm bg-brand/55" />Submitted {usd(s.submitted)}</li>
        <li><span className="mr-1.5 inline-block size-2.5 rounded-sm bg-sun" />Waiting to submit {usd(s.waiting)}</li>
        <li>Expected care before the deadline {usd(future)}</li>
        <li className="text-destructive">At risk {usd(s.forfeitRisk)}</li>
      </ul>
    </div>
  );
}

export function Vault({ summary, receipts, recommended }: { summary: ClaimsResult; receipts: StoredReceipt[]; recommended: boolean }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState<string | undefined>();
  const [text, setText] = useState("");
  const [fields, setFields] = useState<Fields | null>(null);
  const [source, setSource] = useState<"ai" | "manual">("manual");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const today = new Date().toISOString().slice(0, 10);

  async function read(payload: { imageDataUrl?: string; text?: string }) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/receipts/parse", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
      const json = await res.json();
      if (!res.ok) {
        setFields({ provider: "", category: "daycare", amount: 0, serviceFrom: today, serviceTo: today, providerTinLast4: null });
        setSource("manual");
        throw new Error(json.error);
      }
      setFields(json.fields);
      setSource("ai");
    } catch (e) {
      setError(e instanceof Error ? e.message : "We couldn't read this receipt.");
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    if (!fields) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/receipts", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ fields, source, imageDataUrl: image }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      track("receipt_uploaded", { amount: fields.amount, source });
      setFields(null);
      setImage(undefined);
      setText("");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "We couldn't save this receipt.");
    } finally {
      setBusy(false);
    }
  }

  async function advance(r: StoredReceipt) {
    const next = STATUS_NEXT[r.status];
    if (!next) return;
    await fetch("/api/receipts", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: r.id, status: next.to }) });
    if (next.to === "claimed") track("claim_submitted", { amount: r.amount });
    router.refresh();
  }

  async function remove(r: StoredReceipt) {
    await fetch(`/api/receipts?id=${r.id}`, { method: "DELETE" });
    router.refresh();
  }

  const set = (patch: Partial<Fields>) => setFields((f) => (f ? { ...f, ...patch } : f));

  return (
    <div className="space-y-10">
      <section aria-labelledby="pace">
        <h2 id="pace" className="text-2xl font-extrabold leading-tight">
          {recommended ? (
            <>You haven&apos;t elected a Dependent Care FSA yet. Genora recommends <span className="marker tabular">{usd(summary.election)}</span>.</>
          ) : summary.forfeitRisk > 0 ? (
            <>On track to forfeit <span className="marker tabular">{usd(summary.forfeitRisk)}</span> by {fmt(summary.deadline)}.</>
          ) : (
            <>On track to use your full {usd(summary.election)} by {fmt(summary.deadline)}.</>
          )}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {recommended
            ? "Elect it at open enrollment (or within 30 days of a qualifying change). Keep logging childcare receipts here: they become claims the day your FSA starts."
            : `Tracking your ${usd(summary.election)} election. ${summary.daysToDeadline} days left to submit claims.${summary.waiting > 0 ? ` ${usd(summary.waiting)} is ready to submit to your FSA administrator now.` : ""}`}
        </p>
        {!recommended && (
          <div className="panel mt-5 flex flex-col gap-6 p-5 sm:flex-row sm:items-center sm:p-6">
            <UsageRing used={summary.logged} total={summary.election} />
            <div className="flex-1"><PaceBar s={summary} /></div>
          </div>
        )}
        {summary.missingTin.length > 0 && (
          <p className="inset mt-4 border-l-4 border-sun px-4 py-3 text-sm">
            Ask {summary.missingTin.join(", ")} for a taxpayer ID (or a signed Form W-10). You need it for FSA claims and Form 2441.
          </p>
        )}
      </section>

      <section aria-labelledby="add" className="panel p-5 sm:p-6">
        <h2 id="add" className="text-lg font-bold">Add a childcare receipt</h2>
        <p className="mt-1 text-sm text-muted-foreground">AI reads the provider, amount and dates. You check them before anything is saved.</p>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            const url = await compress(f);
            setImage(url);
            void read({ imageDataUrl: url });
          }}
        />
        <div className="mt-4 flex flex-wrap gap-2">
          <Button className="tap" disabled={busy} onClick={() => fileRef.current?.click()}>
            <Camera />{busy && !fields ? "Reading the receipt…" : "Snap or upload a receipt"}
          </Button>
          <Button variant="outline" className="tap" disabled={busy} onClick={() => { setSource("manual"); setFields({ provider: "", category: "daycare", amount: 0, serviceFrom: today, serviceTo: today, providerTinLast4: null }); }}>
            Enter by hand
          </Button>
        </div>
        <details className="mt-4">
          <summary className="tap inline-flex cursor-pointer items-center text-sm font-semibold">Paste receipt text instead</summary>
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} aria-label="Receipt text" className="mt-2 w-full rounded-lg border bg-background p-3 text-sm" />
          <Button variant="outline" className="tap mt-2" disabled={busy || !text.trim()} onClick={() => read({ text })}>Read text</Button>
        </details>

        {error && <p role="alert" className="mt-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}

        {fields && (
          <div className="mt-5 space-y-4 border-t pt-5">
            {source === "ai" && <p className="text-sm font-medium text-brand">Read by AI — check each field.</p>}
            <label className="block text-sm">
              <span className="font-semibold">Provider</span>
              <input value={fields.provider} onChange={(e) => set({ provider: e.target.value })} className="mt-2 h-12 w-full rounded-lg border bg-background px-3 text-base" />
            </label>
            <label className="block text-sm">
              <span className="font-semibold">Type of care</span>
              <select value={fields.category} onChange={(e) => set({ category: e.target.value })} className="mt-2 h-12 w-full rounded-lg border bg-background px-3 text-base">
                {CATEGORIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </label>
            <MoneyInput id="r-amount" label="Amount paid" value={fields.amount} onChange={(v) => set({ amount: v })} />
            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm"><span className="font-semibold">Care from</span><input type="date" value={fields.serviceFrom} onChange={(e) => set({ serviceFrom: e.target.value })} className="mt-2 h-12 w-full rounded-lg border bg-background px-3" /></label>
              <label className="text-sm"><span className="font-semibold">Care to</span><input type="date" value={fields.serviceTo} min={fields.serviceFrom} onChange={(e) => set({ serviceTo: e.target.value })} className="mt-2 h-12 w-full rounded-lg border bg-background px-3" /></label>
            </div>
            <label className="block text-sm">
              <span className="font-semibold">Provider taxpayer ID, last 4 digits</span>
              <input inputMode="numeric" maxLength={4} value={fields.providerTinLast4 ?? ""} onChange={(e) => set({ providerTinLast4: e.target.value.replace(/\D/g, "").slice(0, 4) || null })} placeholder="Optional" className="mt-2 h-12 w-full rounded-lg border bg-background px-3 text-base" />
            </label>
            <div className="flex gap-2">
              <Button className="tap h-12 flex-1" disabled={busy || !fields.provider.trim() || fields.amount <= 0} onClick={save}>{busy ? "Saving…" : "Save receipt"}</Button>
              <Button variant="outline" className="tap h-12" disabled={busy} onClick={() => { setFields(null); setImage(undefined); }}>Cancel</Button>
            </div>
          </div>
        )}
      </section>

      <section aria-labelledby="list">
        <h2 id="list" className="text-lg font-bold">Receipts ({receipts.length})</h2>
        {receipts.length === 0 ? (
          <p className="mt-3 rounded-[18px] border border-dashed border-ink/15 p-5 text-sm text-muted-foreground">No receipts yet. Add your latest daycare or camp payment to start tracking.</p>
        ) : (
          <ul className="panel ledger mt-3">
            {receipts.map((r) => {
              const next = STATUS_NEXT[r.status];
              return (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
                  <div>
                    <p className="font-semibold">{r.provider} <span className="font-normal text-muted-foreground">· {usd(Number(r.amount))}</span></p>
                    <p className="text-muted-foreground">
                      {fmt(r.service_from)}{r.service_to !== r.service_from ? ` – ${fmt(r.service_to)}` : ""} · {r.eligible ? STATUS_LABEL[r.status] : "Not FSA-eligible"}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    {r.eligible && next && <Button size="sm" variant="outline" className="tap" onClick={() => advance(r)}>{next.label}</Button>}
                    <Button size="sm" variant="ghost" className="tap" onClick={() => remove(r)} aria-label={`Delete receipt from ${r.provider}`}>Delete</Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {summary.byProvider.length > 0 && (
        <section aria-labelledby="f2441">
          <h2 id="f2441" className="text-lg font-bold">Form 2441 summary</h2>
          <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">Care providers and amounts for your 2026 return.</p>
            <Button size="sm" variant="outline" className="print:hidden" onClick={() => window.print()}><Printer />Print summary</Button>
          </div>
          <table className="panel mt-3 w-full overflow-hidden text-sm">
            <thead><tr className="border-b text-left text-muted-foreground"><th className="p-3 font-medium">Provider</th><th className="p-3 font-medium">Taxpayer ID</th><th className="p-3 text-right font-medium">Paid</th></tr></thead>
            <tbody className="tabular">
              {summary.byProvider.map((p) => (
                <tr key={p.provider} className="border-b last:border-0">
                  <td className="p-3">{p.provider}</td>
                  <td className="p-3">{p.hasTin ? "On file" : <span className="text-destructive">Missing</span>}</td>
                  <td className="p-3 text-right font-semibold">{usd(p.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
