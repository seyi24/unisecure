"use client";

import { useSession } from "next-auth/react";

import { PlanBadge } from "@/components/admin/plan-badge";
import { Badge } from "@/components/ui/badge";
import { resolveActivePlan } from "@/lib/ai/entitlements";
import { guestRegex } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function UserPlanBadge({ className }: { className?: string }) {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <span
        className={cn(
          "inline-block h-5 w-14 animate-pulse rounded-md bg-muted",
          className
        )}
      />
    );
  }

  const email = session?.user?.email ?? "";
  const isGuest = guestRegex.test(email);

  if (isGuest) {
    return (
      <Badge
        className={cn(
          "border-violet-400/30 bg-violet-500/15 text-violet-300",
          className
        )}
        variant="secondary"
      >
        Guest
      </Badge>
    );
  }

  const activePlan = resolveActivePlan({
    plan: session?.user?.plan,
    planExpiresAt: session?.user?.planExpiresAt,
  });

  return <PlanBadge className={className} plan={activePlan} />;
}
