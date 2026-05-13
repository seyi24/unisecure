import { auth } from "@/app/(auth)/auth";
import { getPaymentByReference } from "@/lib/db/queries";
import type { PaymentStatus, UserPlan } from "@/lib/db/schema";
import { ChatbotError } from "@/lib/errors";

export type PaymentStatusResponse = {
  referenceNumber: string;
  status: PaymentStatus;
  plan: UserPlan;
  amount: number;
  currency: string;
  channel: string;
  updatedAt: string;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const reference = searchParams.get("reference");
  if (!reference) {
    return new ChatbotError(
      "bad_request:api",
      "Missing reference"
    ).toResponse();
  }

  const session = await auth();
  if (!session?.user) {
    return new ChatbotError("unauthorized:chat").toResponse();
  }

  const payment = await getPaymentByReference(reference);
  if (!payment) {
    return Response.json(
      { code: "not_found:api", message: "Payment not found" },
      { status: 404 }
    );
  }

  if (payment.userId !== session.user.id) {
    return new ChatbotError(
      "forbidden:chat",
      "This payment belongs to another user."
    ).toResponse();
  }

  const body: PaymentStatusResponse = {
    referenceNumber: payment.referenceNumber,
    status: payment.status,
    plan: payment.plan,
    amount: payment.amount,
    currency: payment.currency,
    channel: payment.channel,
    updatedAt: payment.updatedAt.toISOString(),
  };

  return Response.json(body);
}
