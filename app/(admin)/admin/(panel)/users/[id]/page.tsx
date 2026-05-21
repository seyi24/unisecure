import { notFound } from "next/navigation";

import { auth } from "@/app/(auth)/auth";
import { UserDetailView } from "@/components/admin/user-detail-view";
import { isAdminEmail, isSuperAdminEmail } from "@/lib/admin/auth";
import {
  getAdminUserDetail,
  getUserChatsForAdmin,
} from "@/lib/db/admin-queries";

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [session, detail] = await Promise.all([auth(), getAdminUserDetail(id)]);

  if (!detail) {
    notFound();
  }

  const chats = await getUserChatsForAdmin(id, 10);
  const { user } = detail;
  const isViewerSuperAdmin = isSuperAdminEmail(session?.user?.email);

  return (
    <UserDetailView
      chats={chats}
      detail={detail}
      isDbAdmin={Boolean(user.isAdmin)}
      isEnvAdmin={isAdminEmail(user.email)}
      isSuperAdmin={isSuperAdminEmail(user.email)}
      isViewerSuperAdmin={isViewerSuperAdmin}
    />
  );
}
