import { redirect } from "next/navigation";

import { auth, signOut } from "@/app/(auth)/auth";
import { isAdminEmail } from "@/lib/admin/auth";

type SearchParams = Promise<{
  redirectUrl?: string;
}>;

export default async function AdminAuthCompletePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const redirectUrl = params.redirectUrl?.startsWith("/admin")
    ? params.redirectUrl
    : "/admin/dashboard";

  const session = await auth();

  if (!session?.user || session.user.isAnonymous) {
    redirect(`/admin/login?redirectUrl=${encodeURIComponent(redirectUrl)}`);
  }

  if (!isAdminEmail(session.user.email)) {
    await signOut({ redirectTo: "/admin/login?error=not_authorized" });
    return;
  }

  redirect(redirectUrl);
}
