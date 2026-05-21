import { Suspense } from "react";

import { SubscriptionPlanCards } from "@/components/admin/subscription-plan-cards";
import { SubscriptionsFilters } from "@/components/admin/subscriptions-filters";
import { SubscriptionsTable } from "@/components/admin/subscriptions-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getSubscriptionOverview,
  listSubscriptionUsers,
} from "@/lib/db/admin-queries";
import type { UserPlan } from "@/lib/db/schema";
import { format } from "date-fns";
import Link from "next/link";

import { PlanBadge } from "@/components/admin/plan-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const PAGE_SIZE = 20;

type SearchParams = Promise<{
  filter?: string;
  plan?: string;
  page?: string;
}>;

export default async function AdminSubscriptionsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const filter =
    params.filter === "active" ||
    params.filter === "expired" ||
    params.filter === "expiring"
      ? params.filter
      : "all";
  const plan =
    params.plan && params.plan !== "all"
      ? (params.plan as UserPlan)
      : "all";

  const query = new URLSearchParams();
  if (filter !== "all") {
    query.set("filter", filter);
  }
  if (plan !== "all") {
    query.set("plan", plan);
  }

  const [overview, { users, total }] = await Promise.all([
    getSubscriptionOverview(),
    listSubscriptionUsers({
      filter,
      plan,
      page,
      pageSize: PAGE_SIZE,
    }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-semibold text-2xl tracking-tight">Subscriptions</h1>
        <p className="text-muted-foreground text-sm">
          Active plans, expiring renewals, and paid account status.
        </p>
      </div>

      <SubscriptionPlanCards
        activeSubscribers={overview.activeSubscribers}
        byPlan={overview.byPlan}
        expiredPaidAccounts={overview.expiredPaidAccounts}
        expiringWithin7Days={overview.expiringWithin7Days}
      />

      {overview.expiringSoon.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Expiring within 7 days</CardTitle>
            <CardDescription>Users who need renewal soon</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Expires</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overview.expiringSoon.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <Link
                        className="font-medium hover:underline"
                        href={`/admin/users/${row.id}`}
                      >
                        {row.email}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <PlanBadge plan={row.plan} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {row.planExpiresAt
                        ? format(row.planExpiresAt, "MMM d, yyyy")
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>All paid accounts</CardTitle>
          <CardDescription>Filter by subscription status and plan</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Suspense fallback={<div className="h-10 animate-pulse rounded-md bg-muted" />}>
            <SubscriptionsFilters />
          </Suspense>
          <SubscriptionsTable
            page={page}
            pageSize={PAGE_SIZE}
            queryString={query.toString()}
            total={total}
            users={users}
          />
        </CardContent>
      </Card>
    </div>
  );
}
