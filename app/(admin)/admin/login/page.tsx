import { Suspense } from "react";

import { AdminLoginView } from "./admin-login-view";

function AdminLoginFallback() {
  return (
    <div className="mx-auto w-full max-w-md space-y-4">
      <div className="h-8 w-48 animate-pulse rounded-md bg-muted" />
      <div className="h-4 w-full animate-pulse rounded-md bg-muted" />
      <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
      <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background p-6">
      <div className="w-full max-w-md">
        <Suspense fallback={<AdminLoginFallback />}>
          <AdminLoginView />
        </Suspense>
      </div>
    </div>
  );
}
