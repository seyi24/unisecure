import { Suspense } from "react";
import ForgotPasswordView from "./forgot-password-view";

function ForgotPasswordViewFallback() {
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
    </>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<ForgotPasswordViewFallback />}>
      <ForgotPasswordView />
    </Suspense>
  );
}
