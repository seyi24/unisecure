"use client";

import { format, parseISO } from "date-fns";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { DailyCountRow, MessagesByPlanRow } from "@/lib/db/admin-queries";
import type { UserPlan } from "@/lib/db/schema";

const messagesConfig = {
  count: { label: "Messages", color: "var(--chart-3)" },
} satisfies ChartConfig;

const planConfig: ChartConfig = {
  free: { label: "Free", color: "var(--chart-4)" },
  starter: { label: "Starter", color: "var(--chart-1)" },
  pro: { label: "Pro", color: "var(--chart-2)" },
  elite: { label: "Elite", color: "var(--chart-3)" },
};

function formatChartDate(date: string) {
  try {
    return format(parseISO(date), "MMM d");
  } catch {
    return date;
  }
}

export function UsageMessagesChart({
  dailyMessages,
  byPlan,
}: {
  dailyMessages: DailyCountRow[];
  byPlan: MessagesByPlanRow[];
}) {
  const planData = byPlan.map((row) => ({
    plan: row.plan,
    count: row.messageCount,
    fill: `var(--color-${row.plan})`,
  }));

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Message volume</CardTitle>
          <CardDescription>User messages per day (30 days)</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer className="h-[240px] w-full" config={messagesConfig}>
            <AreaChart data={dailyMessages}>
              <CartesianGrid vertical={false} />
              <XAxis
                axisLine={false}
                dataKey="date"
                tickFormatter={formatChartDate}
                tickLine={false}
                tickMargin={8}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                dataKey="count"
                fill="var(--color-count)"
                fillOpacity={0.35}
                stroke="var(--color-count)"
                type="monotone"
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>By plan (7 days)</CardTitle>
          <CardDescription>Messages from registered users per stored plan</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer className="h-[240px] w-full" config={planConfig}>
            <BarChart data={planData} layout="vertical">
              <CartesianGrid horizontal={false} />
              <XAxis type="number" />
              <YAxis
                axisLine={false}
                dataKey="plan"
                tickFormatter={(v) => planConfig[v as UserPlan]?.label ?? v}
                tickLine={false}
                type="category"
                width={72}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="count" radius={4} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
