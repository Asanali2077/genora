// npm run samples — prints each sample family and what the engine returns (used for demos and QA).
import { ProfileSchema } from "../lib/domain/profile";
import { analyzeBenefits } from "../lib/engine/benefits";
import { SAMPLES } from "../config/samples";

for (const s of SAMPLES) {
  const r = analyzeBenefits(ProfileSchema.parse(s.profile));
  const split = r.optimal.allocation.filter((a) => a.election > 0).map((a) => `${a.parent} $${a.election}`).join(" + ") || "no FSA";
  console.log(`${s.name}\n  now $${r.current.total} -> best $${r.optimal.total} | found $${r.foundMoney} | FSA ${split} | credit $${r.optimal.careCredit} | CTC $${r.childTaxCredit} | extras ${r.oneTimeExtras.map((x) => `$${x.amount}`).join(",") || "-"} | warnings: ${r.warnings.map((w) => w.id).join(",") || "-"}`);
}