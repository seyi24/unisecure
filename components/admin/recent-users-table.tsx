import Link from "next/link";
import { format } from "date-fns";

import { PlanBadge } from "@/components/admin/plan-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { resolveActivePlan } from "@/lib/ai/entitlements";
import type { RecentUserRow } from "@/lib/db/admin-queries";

export function RecentUsersTable({ rows }: { rows: RecentUserRow[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent signups</CardTitle>
        <CardDescription>Newest registered accounts</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Active plan</TableHead>
              <TableHead>Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell className="text-muted-foreground" colSpan={4}>
                  No registered users yet.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => {
                const activePlan = resolveActivePlan({
                  plan: row.plan,
                  planExpiresAt: row.planExpiresAt,
                });
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
                      <div className="flex items-center gap-2">
                        <PlanBadge plan={activePlan} />
                        {activePlan !== row.plan ? (
                          <Badge variant="outline">stored: {row.plan}</Badge>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(row.createdAt, "MMM d, yyyy")}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
