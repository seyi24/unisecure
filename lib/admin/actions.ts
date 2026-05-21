"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth } from "@/app/(auth)/auth";
import { isAdminEmail } from "@/lib/admin/auth";
import { grantUserPlan, getUserById } from "@/lib/db/queries";
import { userPlans } from "@/lib/db/schema";
import { computePlanExpiry } from "@/lib/payment/plans";

const grantPlanSchema = z.object({
  userId: z.string().uuid(),
  plan: z.enum(userPlans),
});

const extendPlanSchema = z.object({
  userId: z.string().uuid(),
  extraDays: z.coerce.number().int().min(1).max(365),
});

const revokePlanSchema = z.object({
  userId: z.string().uuid(),
});

export type AdminActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

async function requireAdmin(): Promise<AdminActionState | null> {
  const session = await auth();
  if (!session?.user || session.user.isAnonymous) {
    return { status: "error", message: "You must be signed in as an admin." };
  }
  if (!isAdminEmail(session.user.email)) {
    return { status: "error", message: "You do not have admin access." };
  }
  return null;
}

function revalidateUserPaths(userId: string) {
  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
  revalidatePath("/admin/subscriptions");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/usage");
}

export async function grantUserPlanAction(
  _: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const denied = await requireAdmin();
  if (denied) {
    return denied;
  }

  const parsed = grantPlanSchema.safeParse({
    userId: formData.get("userId"),
    plan: formData.get("plan"),
  });

  if (!parsed.success) {
    return { status: "error", message: "Invalid plan or user." };
  }

  const { userId, plan } = parsed.data;
  const target = await getUserById(userId);
  if (!target) {
    return { status: "error", message: "User not found." };
  }
  if (target.isAnonymous) {
    return {
      status: "error",
      message: "Guests must register before receiving a paid plan.",
    };
  }

  const planExpiresAt =
    plan === "free" ? new Date(0) : computePlanExpiry();

  await grantUserPlan({ userId, plan, planExpiresAt });
  revalidateUserPaths(userId);

  const label =
    plan === "free"
      ? "free"
      : `${plan} until ${planExpiresAt.toLocaleDateString()}`;

  return {
    status: "success",
    message: `Granted ${label}.`,
  };
}

export async function extendUserPlanAction(
  _: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const denied = await requireAdmin();
  if (denied) {
    return denied;
  }

  const parsed = extendPlanSchema.safeParse({
    userId: formData.get("userId"),
    extraDays: formData.get("extraDays"),
  });

  if (!parsed.success) {
    return { status: "error", message: "Invalid extension request." };
  }

  const { userId, extraDays } = parsed.data;
  const target = await getUserById(userId);
  if (!target) {
    return { status: "error", message: "User not found." };
  }
  if (target.isAnonymous) {
    return { status: "error", message: "Cannot extend a guest account." };
  }
  if (target.plan === "free") {
    return {
      status: "error",
      message: "Grant a paid plan first, then extend.",
    };
  }

  const now = new Date();
  const base =
    target.planExpiresAt && target.planExpiresAt.getTime() > now.getTime()
      ? target.planExpiresAt
      : now;
  const planExpiresAt = new Date(base);
  planExpiresAt.setDate(planExpiresAt.getDate() + extraDays);

  await grantUserPlan({
    userId,
    plan: target.plan,
    planExpiresAt,
  });
  revalidateUserPaths(userId);

  return {
    status: "success",
    message: `Extended ${target.plan} by ${extraDays} days (expires ${planExpiresAt.toLocaleDateString()}).`,
  };
}

export async function revokeUserPlanAction(
  _: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const denied = await requireAdmin();
  if (denied) {
    return denied;
  }

  const parsed = revokePlanSchema.safeParse({
    userId: formData.get("userId"),
  });

  if (!parsed.success) {
    return { status: "error", message: "Invalid request." };
  }

  const { userId } = parsed.data;
  const target = await getUserById(userId);
  if (!target) {
    return { status: "error", message: "User not found." };
  }

  await grantUserPlan({
    userId,
    plan: "free",
    planExpiresAt: new Date(0),
  });
  revalidateUserPaths(userId);

  return {
    status: "success",
    message: "User reverted to the free plan.",
  };
}
