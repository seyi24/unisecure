import { auth } from "@/app/(auth)/auth";
import { PricingPlans } from "@/components/marketing/pricing-plans";
import { resolveActivePlan } from "@/lib/ai/entitlements";

export default async function PricingPage() {
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
