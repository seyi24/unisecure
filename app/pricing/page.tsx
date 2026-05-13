import { Suspense } from "react";
import { auth } from "@/app/(auth)/auth";
import { PricingPlans } from "@/components/marketing/pricing-plans";
import { resolveActivePlan } from "@/lib/ai/entitlements";

function PricingPlansFallback() {
  return (
    <section className="min-h-dvh bg-background px-6 py-14 text-foreground md:px-10">
      <div className="mx-auto w-full max-w-7xl">
        <div className="mb-10 flex flex-col items-center gap-3">
          <div
            aria-hidden="true"
            className="h-6 w-40 animate-pulse rounded-full bg-muted"
          />
          <div
            aria-hidden="true"
            className="h-10 w-full max-w-md animate-pulse rounded-md bg-muted"
          />
          <div
            aria-hidden="true"
            className="h-4 w-full max-w-xl animate-pulse rounded-md bg-muted"
          />
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              aria-hidden="true"
              className="h-96 animate-pulse rounded-2xl bg-muted/50"
              key={i}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

async function PricingPlansWithSession() {
  const session = await auth();
  const isAuthenticated = !!session?.user && !session.user.isAnonymous;
  const currentPlan = session?.user
    ? resolveActivePlan({
        plan: session.user.plan,
        planExpiresAt: session.user.planExpiresAt,
      })
    : null;

  return (
    <PricingPlans
      currentPlan={isAuthenticated ? currentPlan : null}
      isAuthenticated={isAuthenticated}
      userEmail={session?.user.email ?? null}
    />
  );
}

export default function PricingPage() {
  return (
    <Suspense fallback={<PricingPlansFallback />}>
      <PricingPlansWithSession />
    </Suspense>
  );
}
