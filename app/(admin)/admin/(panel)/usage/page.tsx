import { UsageKpiCards } from "@/components/admin/usage-kpi-cards";
import { UsageMessagesChart } from "@/components/admin/usage-messages-chart";
import { TopUsersTable } from "@/components/admin/top-users-table";
import { GuestsAtLimitTable } from "@/components/admin/guests-at-limit-table";
import {
  getDailyMessages,
  getGuestsAtLifetimeLimit,
  getMessagesByPlan,
  getTopUsersByMessages,
  getUsageOverviewStats,
} from "@/lib/db/admin-queries";

export default async function AdminUsagePage() {
  const [stats, dailyMessages, byPlan, topUsers, guestsAtLimit] =
    await Promise.all([
      getUsageOverviewStats(),
      getDailyMessages(30),
      getMessagesByPlan(7),
      getTopUsersByMessages(7, 15),
      getGuestsAtLifetimeLimit(20),
    ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-semibold text-2xl tracking-tight">Usage</h1>
        <p className="text-muted-foreground text-sm">
          Message volume, plan limits, and high-usage accounts.
        </p>
      </div>
      <UsageKpiCards stats={stats} />
      <UsageMessagesChart byPlan={byPlan} dailyMessages={dailyMessages} />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <TopUsersTable days={7} rows={topUsers} />
        <GuestsAtLimitTable rows={guestsAtLimit} />
      </div>
    </div>
  );
}
