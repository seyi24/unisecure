import "server-only";

export {
  DEFAULT_SUPERADMIN_EMAIL,
  getAdminEmails,
  isAdminAccessConfigured,
  isAdminEmail,
} from "@/lib/admin/allowed-emails";
export {
  hasAdminAccess,
  isSuperAdminEmail,
  isUserAdminById,
} from "@/lib/admin/access";
