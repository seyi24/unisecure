import { Suspense } from "react";

import { UsersFilters } from "@/components/admin/users-filters";
import { UsersTable } from "@/components/admin/users-table";
import { listAdminUsers } from "@/lib/db/admin-queries";
import type { UserPlan } from "@/lib/db/schema";

const PAGE_SIZE = 20;

type SearchParams = Promise<{
  q?: string;
  plan?: string;
  type?: string;
  page?: string;
}>;

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const search = params.q?.trim() || undefined;
  const plan =
    params.plan && params.plan !== "all"
      ? (params.plan as UserPlan)
      : "all";
  const accountType =
    params.type === "registered" || params.type === "guest"
      ? params.type
      : "all";

  const query = new URLSearchParams();
  if (search) {
    query.set("q", search);
  }
  if (plan !== "all") {
    query.set("plan", plan);
  }
  if (accountType !== "all") {
    query.set("type", accountType);
  }

  const { users, total } = await listAdminUsers({
    search,
    plan,
    accountType,
    page,
    pageSize: PAGE_SIZE,
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-semibold text-2xl tracking-tight">Users</h1>
        <p className="text-muted-foreground text-sm">
          Registered accounts and guests across all plans.
        </p>
      </div>
      <Suspense fallback={<div className="h-10 animate-pulse rounded-md bg-muted" />}>
        <UsersFilters />
      </Suspense>
      <UsersTable
        page={page}
        pageSize={PAGE_SIZE}
        queryString={query.toString()}
        total={total}
        users={users}
      />
    </div>
  );
}
