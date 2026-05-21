"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";

import { PlanBadge } from "@/components/admin/plan-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  type AdminActionState,
  extendUserPlanAction,
  grantUserPlanAction,
  revokeUserPlanAction,
} from "@/lib/admin/actions";
import type { UserPlan } from "@/lib/db/schema";
import { PLAN_DURATION_DAYS } from "@/lib/payment/plans";

const initialState: AdminActionState = { status: "idle" };

export function GrantPlanForm({
  userId,
  isAnonymous,
  currentPlan,
  activePlan,
  planExpiresAt,
}: {
  userId: string;
  isAnonymous: boolean;
  currentPlan: UserPlan;
  activePlan: UserPlan;
  planExpiresAt: Date | null;
}) {
  const [grantState, grantAction, grantPending] = useActionState(
    grantUserPlanAction,
    initialState
  );
  const [extendState, extendAction, extendPending] = useActionState(
    extendUserPlanAction,
    initialState
  );
  const [revokeState, revokeAction, revokePending] = useActionState(
    revokeUserPlanAction,
    initialState
  );

  useEffect(() => {
    for (const state of [grantState, extendState, revokeState]) {
      if (state.status === "success" && state.message) {
        toast.success(state.message);
      }
      if (state.status === "error" && state.message) {
        toast.error(state.message);
      }
    }
  }, [grantState, extendState, revokeState]);

  if (isAnonymous) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Plan access</CardTitle>
          <CardDescription>
            Guest accounts must register before you can grant a subscription.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Plan access</CardTitle>
        <CardDescription>
          Grant or extend plans without a payment record. Active:{" "}
          <PlanBadge className="ml-1 inline-flex" plan={activePlan} />
          {planExpiresAt ? (
            <span className="ml-2 text-muted-foreground">
              expires {planExpiresAt.toLocaleDateString()}
            </span>
          ) : null}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <form action={grantAction} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <input name="userId" type="hidden" value={userId} />
          <div className="flex flex-1 flex-col gap-1.5">
            <Label htmlFor="grant-plan">Grant plan</Label>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              defaultValue={currentPlan === "free" ? "starter" : currentPlan}
              id="grant-plan"
              name="plan"
            >
              <option value="starter">Starter (30 days)</option>
              <option value="pro">Pro (30 days)</option>
              <option value="elite">Elite (30 days)</option>
            </select>
          </div>
          <Button disabled={grantPending} type="submit">
            {grantPending ? "Saving…" : "Grant 30 days"}
          </Button>
        </form>

        <form action={extendAction} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <input name="userId" type="hidden" value={userId} />
          <div className="flex flex-1 flex-col gap-1.5">
            <Label htmlFor="extend-days">Extend current plan</Label>
            <Input
              defaultValue={String(PLAN_DURATION_DAYS)}
              id="extend-days"
              max={365}
              min={1}
              name="extraDays"
              type="number"
            />
          </div>
          <Button disabled={extendPending} type="submit" variant="secondary">
            {extendPending ? "Saving…" : "Add days"}
          </Button>
        </form>

        <form action={revokeAction}>
          <input name="userId" type="hidden" value={userId} />
          <Button
            disabled={revokePending || activePlan === "free"}
            type="submit"
            variant="destructive"
          >
            {revokePending ? "Saving…" : "Revoke to free plan"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
