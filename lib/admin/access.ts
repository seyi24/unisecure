import "server-only";

import type { Session } from "next-auth";

import {
  DEFAULT_SUPERADMIN_EMAIL,
  isAdminEmail,
} from "@/lib/admin/allowed-emails";
import { getUserById } from "@/lib/db/queries";

export function isSuperAdminEmail(email: string | null | undefined): boolean {
  if (!email) {
    return false;
  }
  return email.trim().toLowerCase() === DEFAULT_SUPERADMIN_EMAIL.toLowerCase();
}

/** Env allowlist + superadmin (not database-promoted admins). */
export { isAdminEmail } from "@/lib/admin/allowed-emails";

export async function hasAdminAccess(
  session: Session | null | undefined
): Promise<boolean> {
  const email = session?.user?.email;
  if (!email || session.user.isAnonymous) {
    return false;
  }

  if (isAdminEmail(email)) {
    return true;
  }

  const userId = session.user.id;
  if (!userId) {
    return false;
  }

  const dbUser = await getUserById(userId);
  return Boolean(dbUser?.isAdmin);
}

export async function isUserAdminById(userId: string): Promise<boolean> {
  const dbUser = await getUserById(userId);
  if (!dbUser) {
    return false;
  }

  return isAdminEmail(dbUser.email) || Boolean(dbUser.isAdmin);
}
