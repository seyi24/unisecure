import { PlanBadge } from "@/components/admin/plan-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatFcfa } from "@/lib/admin/format";
import type { SubscriptionPlanSummary } from "@/lib/db/admin-queries";
import { PLAN_PRICES_FCFA } from "@/lib/payment/plans";
import type { UserPlan } from "@/lib/db/schema";

export function SubscriptionPlanCards({
  byPlan,
  activeSubscribers,
  expiringWithin7Days,
  expiredPaidAccounts,
}: {
  byPlan: SubscriptionPlanSummary[];
  activeSubscribers: number;
  expiringWithin7Days: number;
  expiredPaidAccounts: number;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard
          description="Paid plans not expired"
          title="Active subscribers"
          value={activeSubscribers.toLocaleString()}
        />
        <SummaryCard
          description="Renewal needed within 7 days"
          title="Expiring soon"
          value={expiringWithin7Days.toLocaleString()}
        />
        <SummaryCard
          description="Stored paid plan, past expiry"
          title="Expired accounts"
          value={expiredPaidAccounts.toLocaleString()}
        />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {byPlan.map((row) => (
          <Card key={row.plan}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  <PlanBadge plan={row.plan as UserPlan} />
                </CardTitle>
                <span className="text-muted-foreground text-sm tabular-nums">
                  {formatFcfa(PLAN_PRICES_FCFA[row.plan as UserPlan])} FCFA
                </span>
              </div>
              <CardDescription>30-day subscription</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-2 text-center text-sm">
              <div>
                <p className="font-semibold text-lg tabular-nums">{row.activeCount}</p>
                <p className="text-muted-foreground text-xs">Active</p>
              </div>
              <div>
                <p className="font-semibold text-lg tabular-nums">{row.storedCount}</p>
                <p className="text-muted-foreground text-xs">Stored plan</p>
              </div>
              <div>
                <p className="font-semibold text-lg tabular-nums">{row.expiredCount}</p>
                <p className="text-muted-foreground text-xs">Expired</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{title}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="font-semibold text-2xl tabular-nums tracking-tight">{value}</p>
        <p className="mt-1 text-muted-foreground text-sm">{description}</p>
      </CardContent>
    </Card>
  );
}
