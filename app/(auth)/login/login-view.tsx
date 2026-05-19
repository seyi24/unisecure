"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { useActionState, useEffect, useState } from "react";

import { AuthForm } from "@/components/chat/auth-form";
import { LogoGoogle } from "@/components/chat/icons";
import { SubmitButton } from "@/components/chat/submit-button";
import { toast } from "@/components/chat/toast";
import { Button } from "@/components/ui/button";
import { type LoginActionState, login } from "../actions";

const ALLOWED_PLANS = new Set(["starter", "pro", "elite"]);

function buildPostAuthRedirect(plan: string | null): string {
  if (plan && ALLOWED_PLANS.has(plan)) {
    return `/pricing?plan=${plan}`;
  }
  return "/";
}

export default function LoginView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planParam = searchParams.get("plan");
  const postAuthRedirect = buildPostAuthRedirect(planParam);

  const [email, setEmail] = useState("");
  const [isSuccessful, setIsSuccessful] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const [state, formAction] = useActionState<LoginActionState, FormData>(
    login,
    { status: "idle" }
  );

  const { update: updateSession } = useSession();

  // biome-ignore lint/correctness/useExhaustiveDependencies: router and updateSession are stable refs
  useEffect(() => {
    if (state.status === "failed") {
      toast({ type: "error", description: "Invalid credentials!" });
    } else if (state.status === "oauth_only") {
      toast({
        type: "error",
        description: "This account uses Google sign-in. Use the Google button below.",
      });
    } else if (state.status === "database_error") {
      toast({
        type: "error",
        description:
          "Sign-in is temporarily unavailable. Check that the production database is configured.",
      });
    } else if (state.status === "invalid_data") {
      toast({
        type: "error",
        description: "Failed validating your submission!",
      });
    } else if (state.status === "success") {
      setIsSuccessful(true);
      updateSession();
      router.replace(postAuthRedirect);
    }
  }, [state.status]);

  const handleSubmit = (formData: FormData) => {
    setEmail(formData.get("email") as string);
    formAction(formData);
  };

  const handleGoogleSignIn = () => {
    setIsGoogleLoading(true);
    void signIn("google", { callbackUrl: postAuthRedirect });
  };

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
      <p className="text-sm text-muted-foreground">
        Sign in to your account to continue
      </p>

      <AuthForm action={handleSubmit} defaultEmail={email} showForgotPassword>
        <SubmitButton isSuccessful={isSuccessful}>Sign in</SubmitButton>
      </AuthForm>

      {/* Divider */}
      <div className="my-4 flex items-center gap-3">
        <div className="flex-1 border-t border-border/40" />
        <span className="text-xs text-muted-foreground">Or continue with</span>
        <div className="flex-1 border-t border-border/40" />
      </div>

      {/* Google Sign-In Button */}
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={handleGoogleSignIn}
        disabled={isGoogleLoading}
      >
        <LogoGoogle size={18} />
        <span className="ml-2">
          {isGoogleLoading ? "Signing in..." : "Sign in with Google"}
        </span>
      </Button>

      <p className="mt-4 text-center text-[13px] text-muted-foreground">
        {"No account? "}
        <Link
          className="text-foreground underline-offset-4 hover:underline"
          href={planParam ? `/register?plan=${planParam}` : "/register"}
        >
          Sign up
        </Link>
      </p>
      <p className="text-center text-[13px] text-muted-foreground">
        {"Need a paid plan? "}
        <Link
          className="text-foreground underline-offset-4 hover:underline"
          href="/pricing"
        >
          View pricing
        </Link>
      </p>
    </>
  );
}
