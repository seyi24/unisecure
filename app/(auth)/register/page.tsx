import { Suspense } from "react";
import RegisterView from "./register-view";

function RegisterViewFallback() {
  return (
    <>
      <div
        aria-hidden="true"
        className="h-8 w-64 animate-pulse rounded-md bg-muted"
      />
      <div
        aria-hidden="true"
        className="h-4 w-full max-w-[240px] animate-pulse rounded-md bg-muted"
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

export default function RegisterPage() {
  return (
    <Suspense fallback={<RegisterViewFallback />}>
      <RegisterView />
    </Suspense>
  );
}
