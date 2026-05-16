import type { UserPlan } from "@/lib/db/schema";

export type Entitlements = {
  maxMessagesPerDay: number;
  canSaveHistory: boolean;
  canUploadFiles: boolean;
  canUseVoiceMode: boolean;
  hasPremiumModels: boolean;
};

export const GUEST_LIFETIME_MESSAGE_LIMIT = 3;

export const guestEntitlements: Entitlements = {
  maxMessagesPerDay: GUEST_LIFETIME_MESSAGE_LIMIT,
  canSaveHistory: false,
  canUploadFiles: false,
  canUseVoiceMode: false,
  hasPremiumModels: false,
};

export const entitlementsByPlan: Record<UserPlan, Entitlements> = {
  free: {
    maxMessagesPerDay: 5,
    canSaveHistory: true,
    canUploadFiles: false,
    canUseVoiceMode: false,
    hasPremiumModels: false,
  },
  starter: {
    maxMessagesPerDay: 15,
    canSaveHistory: true,
    canUploadFiles: false,
    canUseVoiceMode: false,
    hasPremiumModels: false,
  },
  pro: {
    maxMessagesPerDay: 30,
    canSaveHistory: true,
    canUploadFiles: true,
    canUseVoiceMode: true,
    hasPremiumModels: true,
  },
  elite: {
    maxMessagesPerDay: 50,
    canSaveHistory: true,
    canUploadFiles: true,
    canUseVoiceMode: true,
    hasPremiumModels: true,
  },
};

export function resolveActivePlan({
  plan,
  planExpiresAt,
}: {
  plan: UserPlan | null | undefined;
  planExpiresAt: Date | string | null | undefined;
}): UserPlan {
  const effective = plan ?? "free";
  if (effective === "free") {
    return "free";
  }
  if (!planExpiresAt) {
    return effective;
  }
  const expiry =
    typeof planExpiresAt === "string"
      ? new Date(planExpiresAt)
      : planExpiresAt;
  if (Number.isNaN(expiry.getTime())) {
    return effective;
  }
  return expiry.getTime() > Date.now() ? effective : "free";
}

export function getEntitlements({
  isAnonymous,
  plan,
  planExpiresAt,
}: {
  isAnonymous: boolean;
  plan: UserPlan | null | undefined;
  planExpiresAt?: Date | string | null | undefined;
}): Entitlements {
  if (isAnonymous) {
    return guestEntitlements;
  }
  const activePlan = resolveActivePlan({ plan, planExpiresAt });
  return entitlementsByPlan[activePlan];
}
