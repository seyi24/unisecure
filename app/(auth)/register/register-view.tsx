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
import { type RegisterActionState, register } from "../actions";

const ALLOWED_PLANS = new Set(["free", "starter", "pro", "elite"]);

function buildPostAuthRedirect(plan: string | null): string {
  if (plan && ALLOWED_PLANS.has(plan) && plan !== "free") {
    return `/pricing?plan=${plan}`;
  }
  return "/";
}

export default function RegisterView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planParam = searchParams.get("plan");
  const postAuthRedirect = buildPostAuthRedirect(planParam);

  const [email, setEmail] = useState("");
  const [isSuccessful, setIsSuccessful] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const [state, formAction] = useActionState<RegisterActionState, FormData>(
    register,
    { status: "idle" }
  );

  const { update: updateSession } = useSession();

  // biome-ignore lint/correctness/useExhaustiveDependencies: router and updateSession are stable refs
  useEffect(() => {
    if (state.status === "user_exists") {
      toast({ type: "error", description: "Account already exists!" });
    } else if (state.status === "failed") {
      toast({ type: "error", description: "Failed to create account!" });
    } else if (state.status === "invalid_data") {
      toast({
        type: "error",
        description: "Failed validating your submission!",
      });
    } else if (state.status === "success") {
      toast({ type: "success", description: "Account created!" });
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
      <h1 className="text-2xl font-semibold tracking-tight">Create account</h1>
      <p className="text-sm text-muted-foreground">Get started for free</p>
      <AuthForm action={handleSubmit} defaultEmail={email}>
        <SubmitButton isSuccessful={isSuccessful}>Sign up</SubmitButton>
      </AuthForm>

      {/* Divider */}
      <div className="my-4 flex items-center gap-3">
        <div className="flex-1 border-t border-border/40" />
        <span className="text-xs text-muted-foreground">Or continue with</span>
        <div className="flex-1 border-t border-border/40" />
      </div>

      {/* Google Sign-Up Button */}
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={handleGoogleSignIn}
        disabled={isGoogleLoading}
      >
        <LogoGoogle size={18} />
        <span className="ml-2">
          {isGoogleLoading ? "Signing up..." : "Sign up with Google"}
        </span>
      </Button>

      <p className="text-center text-[13px] text-muted-foreground">
        {"Have an account? "}
        <Link
          className="text-foreground underline-offset-4 hover:underline"
          href={planParam ? `/login?plan=${planParam}` : "/login"}
        >
          Sign in
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
