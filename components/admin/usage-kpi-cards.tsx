import { Gauge, MessageSquare, UserCheck, Users } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import type { UsageOverviewStats } from "@/lib/db/admin-queries";

export function UsageKpiCards({ stats }: { stats: UsageOverviewStats }) {
  const cards = [
    {
      label: "Messages today",
      value: stats.messagesToday.toLocaleString(),
      hint: `${stats.registeredMessagesToday} registered · ${stats.guestMessagesToday} guest`,
      icon: MessageSquare,
    },
    {
      label: "Messages (7 days)",
      value: stats.messages7d.toLocaleString(),
      hint: `${stats.messages30d} in the last 30 days`,
      icon: Gauge,
    },
    {
      label: "At daily limit today",
      value: stats.usersAtDailyLimitToday.toLocaleString(),
      hint: "Registered users who hit today's cap",
      icon: UserCheck,
    },
    {
      label: "Guests at lifetime cap",
      value: stats.guestsAtLifetimeLimit.toLocaleString(),
      hint: `${stats.chatsCreatedToday} new chats today`,
      icon: Users,
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
