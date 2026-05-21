import { Badge } from "@/components/ui/badge";
import type { UserPlan } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

const planStyles: Record<UserPlan, string> = {
  free: "bg-muted text-muted-foreground",
  starter: "bg-blue-500/15 text-blue-400",
  pro: "bg-violet-500/15 text-violet-400",
  elite: "bg-amber-500/15 text-amber-400",
};

const planLabels: Record<UserPlan, string> = {
  free: "Free",
  starter: "Starter",
  pro: "Pro",
  elite: "Elite",
};

export function PlanBadge({
  plan,
  className,
}: {
  plan: UserPlan;
  className?: string;
}) {
  return (
    <Badge className={cn(planStyles[plan], className)} variant="secondary">
      {planLabels[plan]}
    </Badge>
  );
}
