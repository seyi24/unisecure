"use server";

import { z } from "zod";

import {
  generatePasswordResetToken,
  hashPasswordResetToken,
} from "@/lib/auth/password-reset-token";
import { buildAppUrl } from "@/lib/app-url";
import { sendPasswordResetEmail } from "@/lib/email/send-password-reset";
import {
  createPasswordResetToken,
  createUser,
  deletePasswordResetTokenById,
  getUser,
  getValidPasswordResetToken,
  updateUserPassword,
} from "@/lib/db/queries";

import { signIn } from "./auth";

const PASSWORD_RESET_EXPIRY_MS = 60 * 60 * 1000;

const authFormSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export type LoginActionState = {
  status:
    | "idle"
    | "in_progress"
    | "success"
    | "failed"
    | "invalid_data"
    | "oauth_only"
    | "database_error";
};

export const login = async (
  _: LoginActionState,
  formData: FormData
): Promise<LoginActionState> => {
  try {
    const validatedData = authFormSchema.parse({
      email: formData.get("email"),
      password: formData.get("password"),
    });

    const [existing] = await getUser(validatedData.email);
    if (existing && !existing.password) {
      return { status: "oauth_only" };
    }

    await signIn("credentials", {
      email: validatedData.email,
      password: validatedData.password,
      redirect: false,
    });

    return { status: "success" };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { status: "invalid_data" };
    }

    const message =
      error instanceof Error ? error.message : "Sign-in failed";
    if (
      message.includes("database") ||
      message.includes("Failed to get user")
    ) {
      return { status: "database_error" };
    }

    return { status: "failed" };
  }
};

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export type ForgotPasswordActionState = {
  status: "idle" | "success" | "invalid_data" | "failed";
  devResetUrl?: string;
};

export const requestPasswordReset = async (
  _: ForgotPasswordActionState,
  formData: FormData
): Promise<ForgotPasswordActionState> => {
  try {
    const { email } = forgotPasswordSchema.parse({
      email: formData.get("email"),
    });

    const [existing] = await getUser(email);

    if (existing?.password) {
      const { token, tokenHash } = generatePasswordResetToken();
      await createPasswordResetToken({
        userId: existing.id,
        tokenHash,
        expiresAt: new Date(Date.now() + PASSWORD_RESET_EXPIRY_MS),
      });

      const resetUrl = buildAppUrl(
        `/reset-password?token=${encodeURIComponent(token)}`
      );

      const emailResult = await sendPasswordResetEmail({ to: email, resetUrl });

      if (
        process.env.NODE_ENV === "development" &&
        emailResult.sent === false
      ) {
        return { status: "success", devResetUrl: resetUrl };
      }
    }

    return { status: "success" };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { status: "invalid_data" };
    }

    return { status: "failed" };
  }
};

const resetPasswordSchema = z
  .object({
    token: z.string().min(1),
    password: z.string().min(6),
    confirmPassword: z.string().min(6),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ResetPasswordActionState = {
  status:
    | "idle"
    | "success"
    | "invalid_data"
    | "invalid_token"
    | "password_mismatch"
    | "failed";
};

export const resetPassword = async (
  _: ResetPasswordActionState,
  formData: FormData
): Promise<ResetPasswordActionState> => {
  try {
    const validated = resetPasswordSchema.parse({
      token: formData.get("token"),
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword"),
    });

    const tokenHash = hashPasswordResetToken(validated.token);
    const resetRecord = await getValidPasswordResetToken(tokenHash);

    if (!resetRecord) {
      return { status: "invalid_token" };
    }

    await updateUserPassword(resetRecord.userId, validated.password);
    await deletePasswordResetTokenById(resetRecord.id);

    return { status: "success" };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const mismatch = error.issues.some(
        (issue) => issue.path.at(0) === "confirmPassword"
      );
      if (mismatch) {
        return { status: "password_mismatch" };
      }
      return { status: "invalid_data" };
    }

    return { status: "failed" };
  }
};

export type RegisterActionState = {
  status:
    | "idle"
    | "in_progress"
    | "success"
    | "failed"
    | "user_exists"
    | "invalid_data";
};

export const register = async (
  _: RegisterActionState,
  formData: FormData
): Promise<RegisterActionState> => {
  try {
    const validatedData = authFormSchema.parse({
      email: formData.get("email"),
      password: formData.get("password"),
    });

    const [user] = await getUser(validatedData.email);

    if (user) {
      return { status: "user_exists" } as RegisterActionState;
    }
    await createUser(validatedData.email, validatedData.password);
    await signIn("credentials", {
      email: validatedData.email,
      password: validatedData.password,
      redirect: false,
    });

    return { status: "success" };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { status: "invalid_data" };
    }

    return { status: "failed" };
  }
};
