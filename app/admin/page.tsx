import type { Metadata } from "next";
import { isAdmin, loadMetrics } from "@/lib/services/admin";
import { economics } from "@/config/economics";
import { unitEconomics } from "@/lib/engine/economics";
import { AdminLogin } from "@/components/admin/login";

export const metadata: Metadata = { title: "Metrics — Genora" };
export const dynamic = "force-dynamic";

const usd = (n: number) => (Number.isFinite(n) ? `$${Math.round(n).toLocaleString("en-US")}` : "—");
const pct = (n: number) => (Number.isFinite(n) ? `${(n * 100).toFixed(1)}%` : "—");

export default async function AdminPage() {
  if (!(await isAdmin())) return <AdminLogin />;
  const m = await loadMetrics();
  if (!m) return <p className="p-8">Supabase is not configured.</p>;

  const top = Math.max(1, ...m.stages.map((s) => s.count));
  const paywall = m.stages.find((s) => s.key === "paywall_view")!.count;
  const paid = m.stages.find((s) => s.key === "purchase")!.count;
  // Use the measured paywall conversion once there is enough real traffic; otherwise the base-case assumption.
  const measured = paywall >= 20;
  const model = unitEconomics({ ...economics, paywallToPaid: measured ? paid / paywall : economics.paywallToPaid });

  return (
    <div className="mx-auto w-full max-w-4xl space-y-10 px-4 pb-20 pt-8">
      <h1 className="text-3xl font-extrabold">Genora metrics</h1>

      <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          ["Households", m.households.toLocaleString("en-US")],
          ["Paying households", m.paying.toLocaleString("en-US")],
          ["ARR (demo checkout)", usd(m.arr)],
          ["Avg found money", usd(m.avgFoundMoney)],
          ["Receipts logged", m.receipts.toLocaleString("en-US")],
          ["Childcare $ tracked", usd(m.receiptDollars)],
          ["School-break plans", m.breakPlans.toLocaleString("en-US")],
        ].map(([k, v]) => (
          <div key={k} className="border-l-4 border-pine/30 pl-3">
            <dt className="text-xs text-muted-foreground">{k}</dt>
            <dd className="mt-0.5 font-heading text-2xl font-extrabold tabular">{v}</dd>
          </div>
        ))}
      </dl>

      <section aria-labelledby="funnel">
        <h2 id="funnel" className="text-xl font-bold">Funnel (real sessions)</h2>
        <ol className="mt-4 space-y-2">
          {m.stages.map((s, i) => (
            <li key={s.key} className="grid grid-cols-[10rem_1fr_6rem] items-center gap-3 text-sm">
              <span>{s.label}</span>
              <span className="h-6 rounded bg-muted">
                <span className="block h-full rounded bg-pine" style={{ width: `${(s.count / top) * 100}%` }} />
              </span>
              <span className="tabular text-right">
                {s.count}
                {i > 0 && m.stages[i - 1].count > 0 && <span className="ml-1 text-muted-foreground">({pct(s.count / m.stages[i - 1].count)})</span>}
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="econ">
        <h2 id="econ" className="text-xl font-bold">Unit economics (3-year horizon)</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Base-case assumptions from docs/STRATEGY.md{measured ? "; paywall conversion measured from real traffic." : "; paywall conversion assumed until 20+ real paywall views."}
        </p>
        <table className="mt-4 w-full max-w-lg text-sm">
          <tbody className="tabular">
            {[
              ["Visit → paid", pct(model.visitToPaid)],
              ["Blended CAC", usd(model.blendedCac)],
              ["LTV (net of refunds, margin)", usd(model.ltv)],
              ["LTV : CAC", Number.isFinite(model.ltvToCac) ? model.ltvToCac.toFixed(1) : "—"],
              ["Blended ARPU / year", usd(model.arpu)],
              ["Households for $100M ARR", model.householdsFor100mArr.toLocaleString("en-US")],
            ].map(([k, v]) => (
              <tr key={k} className="border-b">
                <th scope="row" className="py-2 text-left font-normal">{k}</th>
                <td className="py-2 text-right font-semibold">{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
