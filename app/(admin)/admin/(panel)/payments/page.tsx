import { Suspense } from "react";

import { PaymentStatsCards } from "@/components/admin/payment-stats-cards";
import { PaymentsFilters } from "@/components/admin/payments-filters";
import { PaymentsTable } from "@/components/admin/payments-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getPaymentStats,
  listAdminPayments,
} from "@/lib/db/admin-queries";
import type { PaymentStatus, UserPlan } from "@/lib/db/schema";

const PAGE_SIZE = 25;

type SearchParams = Promise<{
  q?: string;
  status?: string;
  plan?: string;
  channel?: string;
  page?: string;
}>;

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const search = params.q?.trim() || undefined;
  const status =
    params.status && params.status !== "all"
      ? (params.status as PaymentStatus)
      : "all";
  const plan =
    params.plan && params.plan !== "all"
      ? (params.plan as UserPlan)
      : "all";
  const channel =
    params.channel && params.channel !== "all" ? params.channel : "all";

  const query = new URLSearchParams();
  if (search) {
    query.set("q", search);
  }
  if (status !== "all") {
    query.set("status", status);
  }
  if (plan !== "all") {
    query.set("plan", plan);
  }
  if (channel !== "all") {
    query.set("channel", channel);
  }

  const [stats, { payments, total }] = await Promise.all([
    getPaymentStats(),
    listAdminPayments({
      search,
      status,
      plan,
      channel,
      page,
      pageSize: PAGE_SIZE,
    }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-semibold text-2xl tracking-tight">Payments</h1>
        <p className="text-muted-foreground text-sm">
          All PaiementPro transactions and reconciliation status.
        </p>
      </div>
      <PaymentStatsCards stats={stats} />
      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Suspense fallback={<div className="h-10 animate-pulse rounded-md bg-muted" />}>
            <PaymentsFilters />
          </Suspense>
          <PaymentsTable
            page={page}
            pageSize={PAGE_SIZE}
            payments={payments}
            queryString={query.toString()}
            total={total}
          />
        </CardContent>
      </Card>
    </div>
  );
}
