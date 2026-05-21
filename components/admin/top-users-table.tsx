import Link from "next/link";

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
import type { TopUserByMessages } from "@/lib/db/admin-queries";

export function TopUsersTable({
  rows,
  days,
}: {
  rows: TopUserByMessages[];
  days: number;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top users by messages</CardTitle>
        <CardDescription>Highest volume in the last {days} days</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Active plan</TableHead>
              <TableHead className="text-right">Messages</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell className="text-muted-foreground" colSpan={4}>
                  No message activity in this period.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
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
                    {row.isAnonymous ? (
                      <Badge variant="outline">Guest</Badge>
                    ) : (
                      <Badge variant="secondary">Registered</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <PlanBadge plan={row.activePlan} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {row.messageCount}
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
