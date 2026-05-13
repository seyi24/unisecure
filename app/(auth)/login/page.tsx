import { Suspense } from "react";
import LoginView from "./login-view";

function LoginViewFallback() {
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

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginViewFallback />}>
      <LoginView />
    </Suspense>
  );
}
