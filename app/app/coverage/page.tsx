import type { Metadata } from "next";
import { requireHousehold } from "@/lib/services/access";
import { Locked } from "@/components/app/locked";
import { getLatestCoverage } from "@/lib/services/coverage";
import { SAMPLE_CALENDAR } from "@/lib/ai/tasks/school-calendar";
import { Radar } from "@/components/coverage/radar";

export const metadata: Metadata = { title: "School-break radar — Genora" };
export const dynamic = "force-dynamic";

export default async function CoveragePage() {
  const { sb, household, pro } = await requireHousehold();
  const { calendar, result } = await getLatestCoverage(sb, household.id);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-20 pt-8">
      <h1 className="text-3xl font-extrabold leading-tight sm:text-4xl">School-break radar</h1>
      <p className="mt-3 max-w-xl text-muted-foreground">
        Every day the kids are home while you both work, covered at the lowest cost: your spare PTO goes to the most expensive days, and the rest goes to FSA-eligible care.
      </p>
      <div className="mt-8">
        {pro ? (
          <Radar initialClosures={calendar?.days ?? []} initialResult={result} sample={SAMPLE_CALENDAR} today={today} />
        ) : (
          <Locked title="Plan every school break" body="Paste the school calendar and Genora finds every uncovered day, then splits both parents' PTO and FSA-eligible camps at the lowest cost. Included in the Genora plan." />
        )}
      </div>
    </div>
  );
}
