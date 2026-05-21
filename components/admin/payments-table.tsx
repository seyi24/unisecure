import Link from "next/link";
import { format } from "date-fns";

import { PaymentStatusBadge } from "@/components/admin/payment-status-badge";
import { PlanBadge } from "@/components/admin/plan-badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatFcfa } from "@/lib/admin/format";
import type { AdminPaymentRow } from "@/lib/db/admin-queries";

export function PaymentsTable({
  payments,
  page,
  pageSize,
  total,
  queryString = "",
}: {
  payments: AdminPaymentRow[];
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
    return qs ? `/admin/payments?${qs}` : "/admin/payments";
  };

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Reference</TableHead>
            <TableHead>User</TableHead>
            <TableHead>Plan</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Channel</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.length === 0 ? (
            <TableRow>
              <TableCell className="text-muted-foreground" colSpan={7}>
                No payments match your filters.
              </TableCell>
            </TableRow>
          ) : (
            payments.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="max-w-[140px] truncate font-mono text-xs">
                  {row.referenceNumber}
                </TableCell>
                <TableCell>
                  {row.userEmail ? (
                    <Link
                      className="hover:underline"
                      href={`/admin/users/${row.userId}`}
                    >
                      {row.userEmail}
                    </Link>
                  ) : (
                    row.customerEmail ?? "—"
                  )}
                </TableCell>
                <TableCell>
                  <PlanBadge plan={row.plan} />
                </TableCell>
                <TableCell className="tabular-nums">
                  {formatFcfa(row.amount)} FCFA
                </TableCell>
                <TableCell>
                  <PaymentStatusBadge status={row.status} />
                </TableCell>
                <TableCell>{row.channel}</TableCell>
                <TableCell className="text-muted-foreground whitespace-nowrap">
                  {format(row.createdAt, "MMM d, yyyy HH:mm")}
                </TableCell>
              </TableRow>
            ))
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
