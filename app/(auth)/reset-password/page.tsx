import { Suspense } from "react";
import ResetPasswordView from "./reset-password-view";

function ResetPasswordViewFallback() {
  return (
    <>
      <div
        aria-hidden="true"
        className="h-8 w-56 animate-pulse rounded-md bg-muted"
      />
      <div
        aria-hidden="true"
        className="h-4 w-full max-w-[280px] animate-pulse rounded-md bg-muted"
      />
      <div
        aria-hidden="true"
        className="mt-6 h-10 w-full animate-pulse rounded-md bg-muted"
      />
      <div
        aria-hidden="true"
        className="mt-4 h-10 w-full animate-pulse rounded-md bg-muted"
      />
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordViewFallback />}>
      <ResetPasswordView />
    </Suspense>
  );
}
