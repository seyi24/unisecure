import {
  getPaymentByReference,
  grantUserPlan,
  updatePaymentStatus,
} from "@/lib/db/queries";
import type { PaymentStatus } from "@/lib/db/schema";
import { computePlanExpiry } from "@/lib/payment/plans";

const SUCCESS_VALUES = new Set([
  "success",
  "succes",
  "successful",
  "ok",
  "completed",
  "paid",
  "approved",
  "00",
  "0",
  "true",
]);

const FAILURE_VALUES = new Set([
  "failed",
  "failure",
  "echec",
  "echoue",
  "error",
  "declined",
  "ko",
  "cancelled",
  "canceled",
  "false",
]);

function pick(record: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
    if (typeof value === "number") {
      return String(value);
    }
    if (typeof value === "boolean") {
      return String(value);
    }
  }
  return null;
}

function inferStatus(raw: string | null): PaymentStatus | null {
  if (!raw) {
    return null;
  }
  const normalized = raw.toLowerCase();
  if (SUCCESS_VALUES.has(normalized)) {
    return "success";
  }
  if (FAILURE_VALUES.has(normalized)) {
    return "failed";
  }
  return null;
}

async function parsePayload(
  request: Request
): Promise<Record<string, unknown>> {
  const url = new URL(request.url);
  const fromQuery = Object.fromEntries(url.searchParams.entries());

  if (request.method === "GET") {
    return fromQuery;
  }

  const contentType = request.headers.get("content-type") ?? "";

  try {
    if (contentType.includes("application/json")) {
      const json = await request.json();
      return { ...fromQuery, ...(json as Record<string, unknown>) };
    }

    if (
      contentType.includes("application/x-www-form-urlencoded") ||
      contentType.includes("multipart/form-data")
    ) {
      const form = await request.formData();
      const obj: Record<string, unknown> = { ...fromQuery };
      for (const [key, value] of form.entries()) {
        obj[key] = typeof value === "string" ? value : value.name;
      }
      return obj;
    }

    const text = await request.text();
    if (text) {
      try {
        return { ...fromQuery, ...(JSON.parse(text) as Record<string, unknown>) };
      } catch {
        return { ...fromQuery, raw: text };
      }
    }
  } catch {
    // fall through to query-only
  }

  return fromQuery;
}

async function handle(request: Request): Promise<Response> {
  const payload = await parsePayload(request);

  const referenceNumber = pick(payload, [
    "referenceNumber",
    "reference_number",
    "reference",
    "ref",
    "orderId",
    "order_id",
  ]);

  if (!referenceNumber) {
    console.error("PaiementPro notify: missing referenceNumber", payload);
    return Response.json({ ok: false, error: "missing reference" }, {
      status: 400,
    });
  }

  const payment = await getPaymentByReference(referenceNumber);
  if (!payment) {
    console.error("PaiementPro notify: payment not found", {
      referenceNumber,
    });
    return Response.json(
      { ok: false, error: "payment not found" },
      { status: 404 }
    );
  }

  const statusRaw = pick(payload, [
    "status",
    "result",
    "responseCode",
    "response_code",
    "success",
    "state",
  ]);

  let status = inferStatus(statusRaw);
  if (!status && payload.success === true) {
    status = "success";
  }
  if (!status && payload.success === false) {
    status = "failed";
  }
  if (!status) {
    console.warn("PaiementPro notify: unknown status", { payload });
    status = "pending";
  }

  const providerTransactionId = pick(payload, [
    "providerTransactionId",
    "transactionId",
    "transaction_id",
    "id_transaction",
    "id",
  ]);

  await updatePaymentStatus({
    referenceNumber,
    status,
    providerTransactionId,
    notificationPayload: payload,
  });

  if (status === "success" && payment.status !== "success") {
    await grantUserPlan({
      userId: payment.userId,
      plan: payment.plan,
      planExpiresAt: computePlanExpiry(),
    });
  }

  return Response.json({ ok: true, status });
}

export async function POST(request: Request) {
  return handle(request);
}

export async function GET(request: Request) {
  return handle(request);
}
