import Link from "next/link";
import { format } from "date-fns";

import { PaymentStatusBadge } from "@/components/admin/payment-status-badge";
import { PlanBadge } from "@/components/admin/plan-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatFcfa } from "@/lib/admin/format";
import type { RecentPaymentRow } from "@/lib/db/admin-queries";

export function RecentPaymentsTable({ rows }: { rows: RecentPaymentRow[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent payments</CardTitle>
        <CardDescription>Latest transactions across all users</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reference</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell className="text-muted-foreground" colSpan={6}>
                  No payments yet.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-mono text-xs">
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
                      "—"
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
                  <TableCell className="text-muted-foreground">
                    {format(row.createdAt, "MMM d, yyyy HH:mm")}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
