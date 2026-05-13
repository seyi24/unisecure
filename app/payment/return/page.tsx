import { Suspense } from "react";
import { ReturnView } from "./return-view";

export const dynamic = "force-dynamic";

export default function PaymentReturnPage() {
  return (
    <Suspense fallback={<ReturnFallback />}>
      <ReturnView />
    </Suspense>
  );
}

function ReturnFallback() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-4 text-foreground">
      <div className="text-sm text-muted-foreground">Loading…</div>
    </main>
  );
}
