import type { ReactNode } from "react";
import Link from "next/link";
import { format } from "date-fns";

import { AdminRoleForm } from "@/components/admin/admin-role-form";
import { GrantPlanForm } from "@/components/admin/grant-plan-form";
import { PaymentStatusBadge } from "@/components/admin/payment-status-badge";
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
import { getEntitlements } from "@/lib/ai/entitlements";
import { formatFcfa } from "@/lib/admin/format";
import type { AdminUserDetail } from "@/lib/db/admin-queries";

type UserChat = {
  id: string;
  title: string;
  createdAt: Date;
  visibility: string;
};

export function UserDetailView({
  detail,
  chats,
  isViewerSuperAdmin,
  isDbAdmin,
  isEnvAdmin,
  isSuperAdmin,
}: {
  detail: AdminUserDetail;
  chats: UserChat[];
  isViewerSuperAdmin: boolean;
  isDbAdmin: boolean;
  isEnvAdmin: boolean;
  isSuperAdmin: boolean;
}) {
  const { user, activePlan, messagesToday, lifetimeMessages, chatCount, payments } =
    detail;
  const entitlements = getEntitlements({
    isAnonymous: user.isAnonymous,
    plan: user.plan,
    planExpiresAt: user.planExpiresAt,
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <ButtonBack />
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">
            {user.name ?? user.email}
          </h1>
          <p className="text-muted-foreground text-sm">{user.email}</p>
        </div>
      </div>

      <GrantPlanForm
        activePlan={activePlan}
        currentPlan={user.plan}
        isAnonymous={user.isAnonymous}
        planExpiresAt={user.planExpiresAt}
        userId={user.id}
      />

      {isViewerSuperAdmin ? (
        <AdminRoleForm
          isAnonymous={user.isAnonymous}
          isDbAdmin={isDbAdmin}
          isEnvAdmin={isEnvAdmin}
          isSuperAdmin={isSuperAdmin}
          userEmail={user.email}
          userId={user.id}
        />
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Account metadata</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
            <DetailItem label="User ID" value={user.id} mono />
            <DetailItem
              label="Account type"
              value={user.isAnonymous ? "Guest" : "Registered"}
            />
            <DetailItem
              label="Admin access"
              value={
                isSuperAdmin
                  ? "Superadmin"
                  : isEnvAdmin
                    ? "Admin (environment)"
                    : isDbAdmin
                      ? "Admin (granted)"
                      : "No"
              }
            />
            <DetailItem
              label="Email verified"
              value={user.emailVerified ? "Yes" : "No"}
            />
            <DetailItem
              label="Joined"
              value={format(user.createdAt, "PPpp")}
            />
            <DetailItem
              label="Plan expires"
              value={
                user.planExpiresAt
                  ? format(user.planExpiresAt, "PPpp")
                  : "—"
              }
            />
            <DetailItem label="Stored plan" value={user.plan} />
            <DetailItem
              label="Active plan"
              value={<PlanBadge plan={activePlan} />}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Usage today</CardTitle>
            <CardDescription>
              {user.isAnonymous
                ? `${entitlements.maxMessagesPerDay} messages (guest lifetime cap)`
                : `${entitlements.maxMessagesPerDay} messages/day on ${activePlan}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="font-semibold text-3xl tabular-nums">
              {messagesToday}
              <span className="text-muted-foreground text-base font-normal">
                {" "}
                / {entitlements.maxMessagesPerDay}
              </span>
            </p>
            <p className="text-muted-foreground">
              Lifetime user messages: {lifetimeMessages}
            </p>
            <p className="text-muted-foreground">Chats: {chatCount}</p>
            <div className="flex flex-wrap gap-2 pt-1">
              <FeatureBadge enabled={entitlements.canSaveHistory} label="History" />
              <FeatureBadge enabled={entitlements.canUploadFiles} label="Uploads" />
              <FeatureBadge enabled={entitlements.canUseVoiceMode} label="Voice" />
              <FeatureBadge
                enabled={entitlements.hasPremiumModels}
                label="Premium models"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payments</CardTitle>
          <CardDescription>Last 20 transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
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
                  <TableCell className="text-muted-foreground" colSpan={6}>
                    No payments for this user.
                  </TableCell>
                </TableRow>
              ) : (
                payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs">
                      {p.referenceNumber}
                    </TableCell>
                    <TableCell>
                      <PlanBadge plan={p.plan} />
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {formatFcfa(p.amount)} FCFA
                    </TableCell>
                    <TableCell>
                      <PaymentStatusBadge status={p.status} />
                    </TableCell>
                    <TableCell>{p.channel}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(p.createdAt, "MMM d, yyyy HH:mm")}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent chats</CardTitle>
          <CardDescription>Latest conversations</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Visibility</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {chats.length === 0 ? (
                <TableRow>
                  <TableCell className="text-muted-foreground" colSpan={3}>
                    No chats yet.
                  </TableCell>
                </TableRow>
              ) : (
                chats.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="max-w-md truncate font-medium">
                      {c.title}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{c.visibility}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(c.createdAt, "MMM d, yyyy")}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function DetailItem({
  label,
  value,
  mono,
}: {
  label: string;
  value: ReactNode;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="text-muted-foreground">{label}</p>
      <p className={mono ? "font-mono text-xs" : "font-medium"}>{value}</p>
    </div>
  );
}

function FeatureBadge({
  label,
  enabled,
}: {
  label: string;
  enabled: boolean;
}) {
  return (
    <Badge variant={enabled ? "secondary" : "outline"}>
      {label}: {enabled ? "on" : "off"}
    </Badge>
  );
}

function ButtonBack() {
  return (
    <Link
      className="inline-flex h-9 items-center justify-center rounded-md border px-3 text-sm hover:bg-muted"
      href="/admin/users"
    >
      ← Users
    </Link>
  );
}
