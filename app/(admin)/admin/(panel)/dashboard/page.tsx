import { OverviewCharts } from "@/components/admin/overview-charts";
import { OverviewKpiCards } from "@/components/admin/overview-kpi-cards";
import { RecentPaymentsTable } from "@/components/admin/recent-payments-table";
import { RecentUsersTable } from "@/components/admin/recent-users-table";
import {
  getAdminOverviewStats,
  getDailyMessages,
  getDailyRegisteredUsers,
  getDailyRevenue,
  getPlanDistribution,
  getRecentPayments,
  getRecentRegisteredUsers,
} from "@/lib/db/admin-queries";

export default async function AdminOverviewPage() {
  const [
    stats,
    signups,
    revenue,
    messages,
    planDistribution,
    recentPayments,
    recentUsers,
  ] = await Promise.all([
    getAdminOverviewStats(),
    getDailyRegisteredUsers(30),
    getDailyRevenue(30),
    getDailyMessages(30),
    getPlanDistribution(),
    getRecentPayments(10),
    getRecentRegisteredUsers(10),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-semibold text-2xl tracking-tight">Overview</h1>
        <p className="text-muted-foreground text-sm">
          Unisecure users, subscriptions, payments, and chat activity.
        </p>
      </div>
      <OverviewKpiCards stats={stats} />
      <OverviewCharts
        messages={messages}
        planDistribution={planDistribution}
        revenue={revenue}
        signups={signups}
      />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <RecentPaymentsTable rows={recentPayments} />
        <RecentUsersTable rows={recentUsers} />
      </div>
    </div>
  );
}
