import { CheckCircle2, Clock, Receipt, XCircle } from "lucide-react";

import { formatFcfa } from "@/lib/admin/format";
import type { PaymentStats } from "@/lib/db/admin-queries";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";

export function PaymentStatsCards({ stats }: { stats: PaymentStats }) {
  const cards = [
    {
      label: "Total transactions",
      value: stats.totalCount.toLocaleString(),
      hint: `${stats.successRatePercent}% success rate`,
      icon: Receipt,
    },
    {
      label: "Successful",
      value: stats.successCount.toLocaleString(),
      hint: `${formatFcfa(stats.successRevenueFcfa)} FCFA collected`,
      icon: CheckCircle2,
    },
    {
      label: "Pending",
      value: stats.pendingCount.toLocaleString(),
      hint: "Awaiting provider confirmation",
      icon: Clock,
    },
    {
      label: "Failed / cancelled",
      value: (stats.failedCount + stats.cancelledCount).toLocaleString(),
      hint: `${stats.failedCount} failed · ${stats.cancelledCount} cancelled`,
      icon: XCircle,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardDescription>{card.label}</CardDescription>
            <div className="flex size-8 items-center justify-center rounded-lg border bg-muted">
              <card.icon className="size-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="font-semibold text-2xl tabular-nums tracking-tight">
              {card.value}
            </p>
            <p className="mt-1 text-muted-foreground text-sm">{card.hint}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
