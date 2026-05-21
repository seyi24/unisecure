import { Badge } from "@/components/ui/badge";
import type { PaymentStatus } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

const statusStyles: Record<PaymentStatus, string> = {
  pending: "bg-amber-500/15 text-amber-400",
  success: "bg-emerald-500/15 text-emerald-400",
  failed: "bg-red-500/15 text-red-400",
  cancelled: "bg-muted text-muted-foreground",
};

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return (
    <Badge
      className={cn(statusStyles[status], "capitalize")}
      variant="secondary"
    >
      {status}
    </Badge>
  );
}
