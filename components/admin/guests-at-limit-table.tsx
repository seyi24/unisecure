import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { GUEST_LIFETIME_MESSAGE_LIMIT } from "@/lib/ai/entitlements";
import type { GuestAtLifetimeLimitRow } from "@/lib/db/admin-queries";

export function GuestsAtLimitTable({ rows }: { rows: GuestAtLifetimeLimitRow[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Guests at lifetime limit</CardTitle>
        <CardDescription>
          Anonymous users who used all {GUEST_LIFETIME_MESSAGE_LIMIT} messages
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead className="text-right">Messages used</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell className="text-muted-foreground" colSpan={2}>
                  No guests at the cap right now.
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
                  <TableCell className="text-right tabular-nums">
                    {row.lifetimeMessages}
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
