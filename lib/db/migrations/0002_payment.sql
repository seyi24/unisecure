ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "planExpiresAt" timestamp;

CREATE TABLE IF NOT EXISTS "Payment" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "userId" uuid NOT NULL REFERENCES "User"("id"),
  "plan" varchar NOT NULL,
  "amount" integer NOT NULL,
  "currency" varchar(8) NOT NULL DEFAULT '952',
  "channel" varchar(32) NOT NULL,
  "referenceNumber" varchar(64) NOT NULL UNIQUE,
  "status" varchar NOT NULL DEFAULT 'pending',
  "providerTransactionId" text,
  "customerFirstName" text,
  "customerLastName" text,
  "customerPhoneNumber" text,
  "customerEmail" text,
  "notificationPayload" json,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "Payment_userId_idx" ON "Payment" ("userId");
CREATE INDEX IF NOT EXISTS "Payment_status_idx" ON "Payment" ("status");
