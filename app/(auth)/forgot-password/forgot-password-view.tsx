"use client";

import Form from "next/form";
import Link from "next/link";
import { useActionState, useEffect, useState } from "react";

import { SubmitButton } from "@/components/chat/submit-button";
import { toast } from "@/components/chat/toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  type ForgotPasswordActionState,
  requestPasswordReset,
} from "../actions";

export default function ForgotPasswordView() {
  const [email, setEmail] = useState("");
  const [isSuccessful, setIsSuccessful] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [state, formAction] = useActionState<ForgotPasswordActionState, FormData>(
    requestPasswordReset,
    { status: "idle" }
  );

  useEffect(() => {
    if (state.status === "invalid_data") {
      toast({
        type: "error",
        description: "Enter a valid email address.",
      });
    } else if (state.status === "failed") {
      toast({
        type: "error",
        description: "Could not send reset email. Try again later.",
      });
    } else if (state.status === "success") {
      setIsSuccessful(true);
      setSubmitted(true);
    }
  }, [state.status]);

  const handleSubmit = (formData: FormData) => {
    setEmail(formData.get("email") as string);
    formAction(formData);
  };

  if (submitted) {
    return (
      <>
        <h1 className="text-2xl font-semibold tracking-tight">Check your email</h1>
        <p className="text-sm text-muted-foreground">
          If an account exists for that address, we sent a password reset link.
        </p>
        {state.devResetUrl ? (
          <p className="rounded-lg border border-border/50 bg-muted/50 p-3 text-[13px] text-muted-foreground">
            Development mode (email not configured):{" "}
            <Link
              className="text-foreground underline-offset-4 hover:underline"
              href={state.devResetUrl}
            >
              Open reset link
            </Link>
          </p>
        ) : null}
        <p className="text-center text-[13px] text-muted-foreground">
          <Link
            className="text-foreground underline-offset-4 hover:underline"
            href="/login"
          >
            Back to sign in
          </Link>
        </p>
      </>
    );
  }

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Forgot password</h1>
      <p className="text-sm text-muted-foreground">
        Enter your email and we will send you a reset link.
      </p>

      <Form action={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label className="font-normal text-muted-foreground" htmlFor="email">
            Email
          </Label>
          <Input
            autoComplete="email"
            autoFocus
            className="h-10 rounded-lg border-border/50 bg-muted/50 text-sm transition-colors focus:border-foreground/20 focus:bg-muted"
            defaultValue={email}
            id="email"
            name="email"
            placeholder="you@someo.ne"
            required
            type="email"
          />
        </div>
        <SubmitButton isSuccessful={isSuccessful}>Send reset link</SubmitButton>
      </Form>

      <p className="text-center text-[13px] text-muted-foreground">
        <Link
          className="text-foreground underline-offset-4 hover:underline"
          href="/login"
        >
          Back to sign in
        </Link>
      </p>
    </>
  );
}
