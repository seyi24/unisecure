import {
  AlertCircle,
  MessageSquare,
  TrendingUp,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { formatFcfa } from "@/lib/admin/format";
import type { AdminOverviewStats } from "@/lib/db/admin-queries";

export function OverviewKpiCards({ stats }: { stats: AdminOverviewStats }) {
  const cards = [
    {
      label: "Registered users",
      value: stats.registeredUsers.toLocaleString(),
      hint: `${stats.newUsers7d} new in the last 7 days`,
      icon: Users,
    },
    {
      label: "Active subscribers",
      value: stats.activeSubscribers.toLocaleString(),
      hint: "Paid plans not expired",
      icon: TrendingUp,
    },
    {
      label: "Revenue (30 days)",
      value: `${formatFcfa(stats.revenue30dFcfa)} FCFA`,
      hint: `${stats.successfulPayments30d} successful payments`,
      icon: Wallet,
    },
    {
      label: "Messages today",
      value: stats.messagesToday.toLocaleString(),
      hint: `${stats.guestUsers} guest accounts`,
      icon: MessageSquare,
    },
    {
      label: "Failed payments (7d)",
      value: stats.failedPayments7d.toLocaleString(),
      hint: "Needs review if above zero",
      icon: AlertCircle,
    },
    {
      label: "New users (7d)",
      value: stats.newUsers7d.toLocaleString(),
      hint: "Registered accounts only",
      icon: UserPlus,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
