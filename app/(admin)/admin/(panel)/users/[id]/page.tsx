import { notFound } from "next/navigation";

import { UserDetailView } from "@/components/admin/user-detail-view";
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
  const detail = await getAdminUserDetail(id);

  if (!detail) {
    notFound();
  }

  const chats = await getUserChatsForAdmin(id, 10);

  return <UserDetailView chats={chats} detail={detail} />;
}
