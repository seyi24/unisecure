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
import type { AdminUserListItem } from "@/lib/db/admin-queries";

export function UsersTable({
  users,
  page,
  pageSize,
  total,
  queryString = "",
}: {
  users: AdminUserListItem[];
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
    return qs ? `/admin/users?${qs}` : "/admin/users";
  };

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Active plan</TableHead>
            <TableHead>Verified</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableRow>
              <TableCell className="text-muted-foreground" colSpan={7}>
                No users match your filters.
              </TableCell>
            </TableRow>
          ) : (
            users.map((row) => (
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
                  {row.isAnonymous ? (
                    <Badge variant="outline">Guest</Badge>
                  ) : (
                    <Badge variant="secondary">Registered</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap items-center gap-2">
                    <PlanBadge plan={row.activePlan} />
                    {row.activePlan !== row.plan ? (
                      <span className="text-muted-foreground text-xs">
                        stored: {row.plan}
                      </span>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell>
                  {row.isAnonymous ? (
                    "—"
                  ) : row.emailVerified ? (
                    <Badge className="bg-emerald-500/15 text-emerald-400" variant="secondary">
                      Yes
                    </Badge>
                  ) : (
                    <Badge variant="outline">No</Badge>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {format(row.createdAt, "MMM d, yyyy")}
                </TableCell>
                <TableCell className="text-right">
                  <Button asChild size="sm" variant="ghost">
                    <Link href={`/admin/users/${row.id}`}>View</Link>
                  </Button>
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
