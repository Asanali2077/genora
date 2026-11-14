import type { Child, Profile } from "@/lib/domain/profile";
import type { Assignment } from "@/lib/engine/coverage";
import { TAX_YEAR, TRUMP_ACCOUNT } from "@/lib/engine/tax-2026";
import { DateChip } from "@/components/app/date-chip";

const TONES = ["bg-marigold text-ink", "bg-[#9cc3e6] text-ink", "bg-pine text-white", "bg-[#f3c9b6] text-ink"];

function stage(age: number) {
  if (age < 1) return "Baby";
  if (age < 3) return "Toddler";
  if (age < 5) return "Preschooler";
  if (age < 13) return "School age";
  return "Teen";
}

/** What care this child most likely uses, from the family's own spending. */
function careFor(age: number, cc: Profile["childcare"]) {
  if (age < 5) return cc.daycare > 0 ? "Daycare" : cc.preschool > 0 ? "Preschool" : cc.nanny > 0 ? "Nanny" : "Care at home";
  return cc.after_school > 0 ? "School + after-school care" : "School";
}

/** One card per child: who they are, who cares for them, and how long each benefit lasts. */
export function KidCards({ profile, nextGap }: { profile: Profile; nextGap?: Assignment }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Your kids">
      {profile.children.map((c: Child, i) => {
        const age = Math.max(0, TAX_YEAR - c.birthYear);
        const name = c.name.trim() || `Child ${i + 1}`;
        const careYears = Math.max(0, c.birthYear + 13 - TAX_YEAR);
        const ctcYears = Math.max(0, c.birthYear + 17 - TAX_YEAR);
        const trump = c.birthYear >= TRUMP_ACCOUNT.birthYears[0] && c.birthYear <= TRUMP_ACCOUNT.birthYears[1];
        const schoolAge = age >= 5 && age < 13;
        return (
          <li key={i} className="panel p-5">
            <div className="flex items-center gap-3">
              <span className={`flex size-12 items-center justify-center rounded-[14px] font-heading text-xl font-bold ${TONES[i % TONES.length]}`} aria-hidden>
                {name.slice(0, 1).toUpperCase()}
              </span>
              <div>
                <p className="font-heading text-lg font-bold leading-tight text-ink">{name}</p>
                <p className="text-sm text-muted-foreground">{age === 0 ? "Under 1" : `${age} years old`} · {stage(age)}</p>
              </div>
            </div>

            <p className="mt-4 text-sm text-ink">{careFor(age, profile.childcare)}</p>

            {schoolAge && nextGap && (
              <div className="inset mt-3 flex items-center gap-3 p-3">
                <DateChip iso={nextGap.date} tone="sky" />
                <p className="text-sm text-ink">
                  Next day off school: <span className="font-semibold">{nextGap.label}</span>
                  <span className="block text-muted-foreground">{nextGap.cover === "pto" ? `${nextGap.who === "You" ? "You" : nextGap.who} take${nextGap.who === "You" ? "" : "s"} the day off` : nextGap.cover === "camp" ? "Day camp booked in the plan" : "Sitter in the plan"}</span>
                </p>
              </div>
            )}

            <ul className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
              {careYears > 0 ? (
                <li className="rounded-full bg-pine/[0.08] px-2.5 py-1 text-pine">Care benefits for {careYears} more year{careYears === 1 ? "" : "s"}</li>
              ) : (
                <li className="rounded-full bg-ink/[0.06] px-2.5 py-1 text-muted-foreground">Past care-benefit age</li>
              )}
              {ctcYears > 0 && <li className="rounded-full bg-pine/[0.08] px-2.5 py-1 text-pine">Child Tax Credit until {c.birthYear + 17}</li>}
              {trump && <li className="rounded-full bg-marigold/25 px-2.5 py-1 text-ink">$1,000 Trump Account</li>}
            </ul>
          </li>
        );
      })}
    </ul>
  );
}
