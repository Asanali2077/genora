import type { Metadata } from "next";
import { requireHousehold } from "@/lib/services/access";
import { Locked } from "@/components/app/locked";
import { PageHeader } from "@/components/app/shell";
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
    <>
      <PageHeader title="School breaks" sub="Every day the kids are home while you both work, covered at the lowest cost: spare PTO goes to the most expensive days, the rest to FSA-eligible care." />
      <div className="max-w-4xl px-5 py-8 md:px-10">
        {pro ? (
          <Radar initialClosures={calendar?.days ?? []} initialResult={result} sample={SAMPLE_CALENDAR} today={today} />
        ) : (
          <Locked title="Plan every school break" body="Paste the school calendar and Genora finds every uncovered day, then splits both parents' PTO and FSA-eligible camps at the lowest cost. Included in the Genora plan." />
        )}
      </div>
    </>
  );
}
