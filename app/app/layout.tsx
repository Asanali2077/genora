import { requireHousehold } from "@/lib/services/access";
import { AppShell } from "@/components/app/shell";

export default async function AppLayout({ children }: LayoutProps<"/app">) {
  const { household, pro } = await requireHousehold();
  const parents = household.profile.filingStatus === "mfj" ? household.profile.parents.map((p) => p.label) : [household.profile.parents[0].label];
  return (
    <AppShell parents={parents} pro={pro}>
      {children}
    </AppShell>
  );
}
