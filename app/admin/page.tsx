import { isAdmin } from "@/lib/admin-auth";
import { buildFunnel } from "@/lib/funnel";
import { appConfig } from "@/config/app.config";
import { AdminLogin } from "@/components/admin/admin-login";
import { AdminDashboard } from "@/components/admin/admin-dashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await isAdmin())) return <AdminLogin />;
  const data = await buildFunnel();
  return <AdminDashboard data={data} econ={appConfig.econ} />;
}
