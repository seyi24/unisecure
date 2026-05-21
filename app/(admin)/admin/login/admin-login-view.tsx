"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useEffect, useRef, useState } from "react";

import { AuthForm } from "@/components/chat/auth-form";
import { LogoGoogle } from "@/components/chat/icons";
import { SubmitButton } from "@/components/chat/submit-button";
import { toast } from "@/components/chat/toast";
import { Button } from "@/components/ui/button";
import { DEFAULT_SUPERADMIN_EMAIL } from "@/lib/admin/allowed-emails";

const ADMIN_CALLBACK = "/admin/auth/complete";

export function AdminLoginView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirectUrl") ?? "/admin/dashboard";
  const error = searchParams.get("error");

  const [email, setEmail] = useState(DEFAULT_SUPERADMIN_EMAIL);
  const [isSuccessful, setIsSuccessful] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasShownError = useRef(false);

  useEffect(() => {
    if (error === "not_authorized" && !hasShownError.current) {
      hasShownError.current = true;
      toast({
        type: "error",
        description: "This account is not authorized for admin access.",
      });
    }
  }, [error]);

  const handleGoogleSignIn = () => {
    setIsGoogleLoading(true);
    void signIn("google", {
      callbackUrl: `${ADMIN_CALLBACK}?redirectUrl=${encodeURIComponent(redirectUrl)}`,
    });
  };

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true);
    setEmail(formData.get("email") as string);

    const result = await signIn("admin", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false,
    });

    setIsSubmitting(false);

    if (result?.error) {
      toast({
        type: "error",
        description:
          "Invalid admin credentials or this email is not an administrator.",
      });
      return;
    }

    setIsSuccessful(true);
    router.replace(
      `${ADMIN_CALLBACK}?redirectUrl=${encodeURIComponent(redirectUrl)}`
    );
  };

  return (
    <>
      <h1 className="font-semibold text-2xl tracking-tight">Unisecure Admin</h1>
      <p className="text-muted-foreground text-sm">
        Sign in with your administrator account. Access is restricted to
        approved emails only.
      </p>

      <AuthForm action={handleSubmit} defaultEmail={email} showForgotPassword={false}>
        <SubmitButton isSuccessful={isSuccessful || isSubmitting}>
          {isSubmitting ? "Signing in…" : "Sign in"}
        </SubmitButton>
      </AuthForm>

      <div className="my-4 flex items-center gap-3">
        <div className="flex-1 border-border/40 border-t" />
        <span className="text-muted-foreground text-xs">Or continue with</span>
        <div className="flex-1 border-border/40 border-t" />
      </div>

      <Button
        className="w-full"
        disabled={isGoogleLoading}
        onClick={handleGoogleSignIn}
        type="button"
        variant="outline"
      >
        <LogoGoogle size={18} />
        <span className="ml-2">
          {isGoogleLoading ? "Signing in…" : "Sign in with Google"}
        </span>
      </Button>

      <p className="mt-6 text-center text-muted-foreground text-sm">
        <Link className="underline-offset-4 hover:underline" href="/chat">
          Back to Unisecure app
        </Link>
      </p>
    </>
  );
}
