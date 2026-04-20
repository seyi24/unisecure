"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useActionState, useEffect, useState } from "react";
import { AuthForm } from "@/components/chat/auth-form";
import { SubmitButton } from "@/components/chat/submit-button";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/chat/toast";
import { LogoGoogle } from "@/components/chat/icons";
import { type RegisterActionState, register } from "../actions";
import { signIn } from "next-auth/react";

export default function Page() {
  const router = useRouter();
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
      router.refresh();
    }
  }, [state.status]);

  const handleSubmit = (formData: FormData) => {
    setEmail(formData.get("email") as string);
    formAction(formData);
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      const result = await signIn("google", {
        redirect: false,
        callbackUrl: "/",
      });

      if (result?.error) {
        toast({ type: "error", description: "Failed to sign up with Google" });
      } else if (result?.ok) {
        updateSession();
        router.refresh();
      }
    } catch (error) {
      toast({ type: "error", description: "An error occurred during sign up" });
      console.error("Google sign-up error:", error);
    } finally {
      setIsGoogleLoading(false);
    }
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
          href="/login"
        >
          Sign in
        </Link>
      </p>
    </>
  );
}
