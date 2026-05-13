import { nanoid } from "nanoid";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import { createPendingPayment } from "@/lib/db/queries";
import { userPlans } from "@/lib/db/schema";
import { ChatbotError } from "@/lib/errors";
import {
  ALLOWED_CHANNELS,
  getPlanPrice,
  PAIEMENT_PRO_CURRENCY,
} from "@/lib/payment/plans";

const bodySchema = z.object({
  plan: z.enum(userPlans),
  channel: z.string().refine((value) => ALLOWED_CHANNELS.has(value), {
    message: "Unsupported payment channel",
  }),
  firstName: z.string().trim().min(1).max(64),
  lastName: z.string().trim().min(1).max(64),
  phoneNumber: z.string().trim().min(5).max(32),
});

export type PaymentInitResponse = {
  referenceNumber: string;
  merchantId: string;
  amount: number;
  currency: string;
  channel: string;
  customerEmail: string;
  customerFirstName: string;
  customerLastName: string;
  customerPhoneNumber: string;
  description: string;
  notificationURL: string;
  returnURL: string;
};

function getBaseUrl(request: Request): string {
  const envUrl =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.APP_URL?.trim() ||
    "";
  if (envUrl) {
    return envUrl.replace(/\/$/, "");
  }
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return new ChatbotError("unauthorized:chat").toResponse();
  }
  if (session.user.isAnonymous) {
    return new ChatbotError(
      "forbidden:guest",
      "Sign up before subscribing to a paid plan."
    ).toResponse();
  }

  const merchantId = process.env.NEXT_PUBLIC_PAIEMENT_PRO_MERCHANT_ID;
  if (!merchantId) {
    return Response.json(
      {
        code: "bad_request:api",
        message:
          "PaiementPro merchant ID not configured. Set NEXT_PUBLIC_PAIEMENT_PRO_MERCHANT_ID.",
      },
      { status: 500 }
    );
  }

  let payload: z.infer<typeof bodySchema>;
  try {
    payload = bodySchema.parse(await request.json());
  } catch (_error) {
    return new ChatbotError(
      "bad_request:api",
      "Invalid payment payload"
    ).toResponse();
  }

  const amount = getPlanPrice(payload.plan);
  if (amount <= 0) {
    return new ChatbotError(
      "bad_request:api",
      "Selected plan is not purchasable."
    ).toResponse();
  }

  const referenceNumber = `UNS-${Date.now().toString(36)}-${nanoid(10)}`;
  const baseUrl = getBaseUrl(request);

  const customerEmail = session.user.email ?? "";

  await createPendingPayment({
    userId: session.user.id,
    plan: payload.plan,
    amount,
    currency: PAIEMENT_PRO_CURRENCY,
    channel: payload.channel,
    referenceNumber,
    customerFirstName: payload.firstName,
    customerLastName: payload.lastName,
    customerPhoneNumber: payload.phoneNumber,
    customerEmail,
  });

  const body: PaymentInitResponse = {
    referenceNumber,
    merchantId,
    amount,
    currency: PAIEMENT_PRO_CURRENCY,
    channel: payload.channel,
    customerEmail,
    customerFirstName: payload.firstName,
    customerLastName: payload.lastName,
    customerPhoneNumber: payload.phoneNumber,
    description: `Unisecure ${payload.plan} plan subscription`,
    notificationURL: `${baseUrl}/api/payment/notify`,
    returnURL: `${baseUrl}/payment/return?reference=${encodeURIComponent(
      referenceNumber
    )}`,
  };

  return Response.json(body);
}
