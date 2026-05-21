import Link from "next/link";
import { format } from "date-fns";

import { PlanBadge } from "@/components/admin/plan-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { SubscriptionUserRow } from "@/lib/db/admin-queries";

export function SubscriptionsTable({
  users,
  page,
  pageSize,
  total,
  queryString = "",
}: {
  users: SubscriptionUserRow[];
  page: number;
  pageSize: number;
  total: number;
  queryString?: string;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const buildPageUrl = (nextPage: number) => {
    const params = new URLSearchParams(queryString);
    params.set("page", String(nextPage));
    const qs = params.toString();
    return qs ? `/admin/subscriptions?${qs}` : "/admin/subscriptions";
  };

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Stored plan</TableHead>
            <TableHead>Active plan</TableHead>
            <TableHead>Expires</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableRow>
              <TableCell className="text-muted-foreground" colSpan={6}>
                No subscribers match your filters.
              </TableCell>
            </TableRow>
          ) : (
            users.map((row) => {
              const isExpired =
                row.planExpiresAt &&
                row.planExpiresAt.getTime() <= Date.now();
              const isExpiringSoon =
                row.planExpiresAt &&
                row.planExpiresAt.getTime() > Date.now() &&
                row.planExpiresAt.getTime() <= Date.now() + 7 * 24 * 60 * 60 * 1000;

              return (
                <TableRow key={row.id}>
                  <TableCell>
                    <Link
                      className="font-medium hover:underline"
                      href={`/admin/users/${row.id}`}
                    >
                      {row.email}
                    </Link>
                  </TableCell>
                  <TableCell>{row.name ?? "—"}</TableCell>
                  <TableCell>
                    <PlanBadge plan={row.plan} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <PlanBadge plan={row.activePlan} />
                      {isExpired ? (
                        <Badge variant="destructive">Expired</Badge>
                      ) : null}
                      {isExpiringSoon && !isExpired ? (
                        <Badge className="bg-amber-500/15 text-amber-400" variant="secondary">
                          Soon
                        </Badge>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground whitespace-nowrap">
                    {row.planExpiresAt
                      ? format(row.planExpiresAt, "MMM d, yyyy")
                      : "No expiry set"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild size="sm" variant="ghost">
                      <Link href={`/admin/users/${row.id}`}>View</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      <div className="flex items-center justify-between text-muted-foreground text-sm">
        <p>
          Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of{" "}
          {total}
        </p>
        <div className="flex gap-2">
          <Button asChild disabled={page <= 1} size="sm" variant="outline">
            <Link href={buildPageUrl(page - 1)}>Previous</Link>
          </Button>
          <Button asChild disabled={page >= totalPages} size="sm" variant="outline">
            <Link href={buildPageUrl(page + 1)}>Next</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
