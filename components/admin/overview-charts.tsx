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
import { formatFcfa } from "@/lib/admin/format";
import type { DailyCountRow, PlanCountRow } from "@/lib/db/admin-queries";
import type { UserPlan } from "@/lib/db/schema";

const signupsConfig = {
  count: { label: "Signups", color: "var(--chart-1)" },
} satisfies ChartConfig;

const revenueConfig = {
  count: { label: "FCFA", color: "var(--chart-2)" },
} satisfies ChartConfig;

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

export function OverviewCharts({
  signups,
  revenue,
  messages,
  planDistribution,
}: {
  signups: DailyCountRow[];
  revenue: DailyCountRow[];
  messages: DailyCountRow[];
  planDistribution: PlanCountRow[];
}) {
  const planChartData = planDistribution.map((row) => ({
    plan: row.plan,
    count: row.count,
    fill: `var(--color-${row.plan})`,
  }));

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Signups</CardTitle>
          <CardDescription>Registered users per day (30 days)</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer className="h-[240px] w-full" config={signupsConfig}>
            <AreaChart data={signups}>
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
          <CardTitle>Revenue</CardTitle>
          <CardDescription>Successful payments per day (FCFA)</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer className="h-[240px] w-full" config={revenueConfig}>
            <BarChart data={revenue}>
              <CartesianGrid vertical={false} />
              <XAxis
                axisLine={false}
                dataKey="date"
                tickFormatter={formatChartDate}
                tickLine={false}
                tickMargin={8}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => `${formatFcfa(Number(value))} FCFA`}
                  />
                }
              />
              <Bar dataKey="count" fill="var(--color-count)" radius={4} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Messages</CardTitle>
          <CardDescription>User messages per day</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer className="h-[240px] w-full" config={messagesConfig}>
            <AreaChart data={messages}>
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
          <CardTitle>Plan mix</CardTitle>
          <CardDescription>Registered users by stored plan</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer className="h-[240px] w-full" config={planConfig}>
            <BarChart data={planChartData} layout="vertical">
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
