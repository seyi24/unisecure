import { auth } from "@/app/(auth)/auth";
import {
  getEntitlements,
  GUEST_LIFETIME_MESSAGE_LIMIT,
} from "@/lib/ai/entitlements";
import {
  getLifetimeMessageCountByUserId,
  getMessageCountByUserIdSince,
} from "@/lib/db/queries";
import { ChatbotError } from "@/lib/errors";

export type UsageResponse = {
  isAnonymous: boolean;
  plan: "free" | "starter" | "pro" | "elite";
  used: number;
  limit: number;
  remaining: number;
  scope: "lifetime" | "day";
};

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return new ChatbotError("unauthorized:chat").toResponse();
  }

  const entitlements = getEntitlements({
    isAnonymous: session.user.isAnonymous,
    plan: session.user.plan,
  });

  let used = 0;
  let limit = 0;
  let scope: "lifetime" | "day" = "day";

  if (session.user.isAnonymous) {
    used = await getLifetimeMessageCountByUserId({ id: session.user.id });
    limit = GUEST_LIFETIME_MESSAGE_LIMIT;
    scope = "lifetime";
  } else {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    used = await getMessageCountByUserIdSince({
      id: session.user.id,
      since: startOfDay,
    });
    limit = entitlements.maxMessagesPerDay;
    scope = "day";
  }

  const remaining = Math.max(0, limit - used);

  const body: UsageResponse = {
    isAnonymous: session.user.isAnonymous,
    plan: session.user.plan,
    used,
    limit,
    remaining,
    scope,
  };

  return Response.json(body);
}
