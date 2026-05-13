import type { UserPlan } from "@/lib/db/schema";

export type Entitlements = {
  maxMessagesPerDay: number;
  canSaveHistory: boolean;
  canUploadFiles: boolean;
  hasPremiumModels: boolean;
};

export const GUEST_LIFETIME_MESSAGE_LIMIT = 3;

export const guestEntitlements: Entitlements = {
  maxMessagesPerDay: GUEST_LIFETIME_MESSAGE_LIMIT,
  canSaveHistory: false,
  canUploadFiles: false,
  hasPremiumModels: false,
};

export const entitlementsByPlan: Record<UserPlan, Entitlements> = {
  free: {
    maxMessagesPerDay: 5,
    canSaveHistory: true,
    canUploadFiles: false,
    hasPremiumModels: false,
  },
  starter: {
    maxMessagesPerDay: 15,
    canSaveHistory: true,
    canUploadFiles: true,
    hasPremiumModels: false,
  },
  pro: {
    maxMessagesPerDay: 30,
    canSaveHistory: true,
    canUploadFiles: true,
    hasPremiumModels: true,
  },
  elite: {
    maxMessagesPerDay: 50,
    canSaveHistory: true,
    canUploadFiles: true,
    hasPremiumModels: true,
  },
};

export function getEntitlements({
  isAnonymous,
  plan,
}: {
  isAnonymous: boolean;
  plan: UserPlan | null | undefined;
}): Entitlements {
  if (isAnonymous) {
    return guestEntitlements;
  }
  return entitlementsByPlan[plan ?? "free"];
}
