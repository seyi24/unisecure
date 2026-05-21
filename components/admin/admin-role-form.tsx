"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type AdminActionState,
  setUserAdminRoleAction,
} from "@/lib/admin/actions";

const initialState: AdminActionState = { status: "idle" };

export function AdminRoleForm({
  userId,
  userEmail,
  isAnonymous,
  isDbAdmin,
  isEnvAdmin,
  isSuperAdmin,
}: {
  userId: string;
  userEmail: string;
  isAnonymous: boolean;
  isDbAdmin: boolean;
  isEnvAdmin: boolean;
  isSuperAdmin: boolean;
}) {
  const [state, action, pending] = useActionState(
    setUserAdminRoleAction,
    initialState
  );

  useEffect(() => {
    if (state.status === "success" && state.message) {
      toast.success(state.message);
    }
    if (state.status === "error" && state.message) {
      toast.error(state.message);
    }
  }, [state]);

  if (isAnonymous) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Administrator access</CardTitle>
          <CardDescription>
            Guest accounts must register before they can be made an admin.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (isSuperAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Administrator access</CardTitle>
          <CardDescription>
            This account is the superadmin and always has full access.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Badge variant="default">Superadmin</Badge>
        </CardContent>
      </Card>
    );
  }

  const statusLabel = isEnvAdmin
    ? "Admin (environment allowlist)"
    : isDbAdmin
      ? "Admin (granted by superadmin)"
      : "Not an administrator";

  const canGrantDbAdmin = !isDbAdmin && !isEnvAdmin;
  const canRevokeDbAdmin = isDbAdmin && !isEnvAdmin;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Administrator access</CardTitle>
        <CardDescription>
          Grant or revoke access to the Unisecure admin dashboard for{" "}
          <span className="font-medium text-foreground">{userEmail}</span>.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground text-sm">Status:</span>
          <Badge variant={isDbAdmin || isEnvAdmin ? "default" : "secondary"}>
            {statusLabel}
          </Badge>
        </div>

        {isEnvAdmin ? (
          <p className="text-muted-foreground text-sm">
            This email is listed in <code className="text-xs">ADMIN_EMAILS</code>.
            Remove it from your environment variables to revoke access.
          </p>
        ) : null}

        {canGrantDbAdmin ? (
          <form action={action}>
            <input name="isAdmin" type="hidden" value="true" />
            <input name="userId" type="hidden" value={userId} />
            <Button disabled={pending} type="submit">
              {pending ? "Saving…" : "Grant admin access"}
            </Button>
          </form>
        ) : null}

        {canRevokeDbAdmin ? (
          <form action={action}>
            <input name="isAdmin" type="hidden" value="false" />
            <input name="userId" type="hidden" value={userId} />
            <Button disabled={pending} type="submit" variant="destructive">
              {pending ? "Saving…" : "Remove admin access"}
            </Button>
          </form>
        ) : null}
      </CardContent>
    </Card>
  );
}
