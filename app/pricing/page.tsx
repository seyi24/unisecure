import { auth } from "@/app/(auth)/auth";
import { PricingPlans } from "@/components/marketing/pricing-plans";

export default async function PricingPage() {
  const session = await auth();
  const isAuthenticated = !!session?.user && !session.user.isAnonymous;
  const currentPlan = session?.user.plan ?? null;

  return (
    <PricingPlans
      currentPlan={isAuthenticated ? currentPlan : null}
      isAuthenticated={isAuthenticated}
    />
  );
}
