"use client";

import { CheckCircle2Icon, Loader2Icon, XCircleIcon } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import useSWR from "swr";
import type { PaymentStatusResponse } from "@/app/(chat)/api/payment/status/route";
import { Button } from "@/components/ui/button";

const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 60_000;

const fetcher = async (url: string): Promise<PaymentStatusResponse> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to fetch payment status");
  }
  return response.json();
};

export function ReturnView() {
  const params = useSearchParams();
  const { update: updateSession } = useSession();
  const reference = params.get("reference");
  const refreshedRef = useRef(false);
  const [timedOut, setTimedOut] = useState(false);

  const { data, error } = useSWR<PaymentStatusResponse>(
    reference
      ? `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/payment/status?reference=${encodeURIComponent(reference)}`
      : null,
    fetcher,
    {
      refreshInterval: (latest) =>
        latest?.status === "success" || latest?.status === "failed"
          ? 0
          : POLL_INTERVAL_MS,
      revalidateOnFocus: false,
    }
  );

  useEffect(() => {
    if (data?.status === "success" && !refreshedRef.current) {
      refreshedRef.current = true;
      updateSession();
    }
  }, [data?.status, updateSession]);

  useEffect(() => {
    const timer = setTimeout(() => setTimedOut(true), POLL_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, []);

  if (!reference) {
    return (
      <Shell>
        <Header
          icon={<XCircleIcon className="size-10 text-red-400" />}
          subtitle="No transaction reference was found in the URL."
          title="Invalid payment link"
        />
        <Actions />
      </Shell>
    );
  }

  if (error) {
    return (
      <Shell>
        <Header
          icon={<XCircleIcon className="size-10 text-red-400" />}
          subtitle="We couldn't load this payment. Please try again later."
          title="Something went wrong"
        />
        <Actions reference={reference} />
      </Shell>
    );
  }

  if (!data) {
    return (
      <Shell>
        <Header
          icon={
            <Loader2Icon className="size-10 animate-spin text-muted-foreground" />
          }
          subtitle="Confirming your payment with PaiementPro…"
          title="Checking payment"
        />
      </Shell>
    );
  }

  if (data.status === "success") {
    return (
      <Shell>
        <Header
          icon={<CheckCircle2Icon className="size-10 text-emerald-400" />}
          subtitle={`Your ${data.plan} plan is now active.`}
          title="Payment successful"
        />
        <SummaryCard data={data} />
        <Actions success />
      </Shell>
    );
  }

  if (data.status === "failed" || data.status === "cancelled") {
    return (
      <Shell>
        <Header
          icon={<XCircleIcon className="size-10 text-red-400" />}
          subtitle="We couldn't process this payment. You can try again from the pricing page."
          title="Payment was not completed"
        />
        <SummaryCard data={data} />
        <Actions reference={reference} />
      </Shell>
    );
  }

  if (timedOut) {
    return (
      <Shell>
        <Header
          icon={<Loader2Icon className="size-10 text-muted-foreground" />}
          subtitle="The payment is still pending. PaiementPro will notify us once it's confirmed. You can safely close this window — we'll update your plan as soon as it's processed."
          title="Payment is still pending"
        />
        <SummaryCard data={data} />
        <Actions reference={reference} />
      </Shell>
    );
  }

  return (
    <Shell>
      <Header
        icon={
          <Loader2Icon className="size-10 animate-spin text-muted-foreground" />
        }
        subtitle="Hang tight — we're waiting for confirmation from PaiementPro."
        title="Processing payment"
      />
      <SummaryCard data={data} />
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-4 py-10 text-foreground">
      <div className="flex w-full max-w-md flex-col gap-6 rounded-2xl border border-border bg-card/60 p-8 shadow-[var(--shadow-float)]">
        {children}
      </div>
    </main>
  );
}

function Header({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="mb-4">{icon}</div>
      <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}

function SummaryCard({ data }: { data: PaymentStatusResponse }) {
  return (
    <div className="space-y-1.5 rounded-xl border border-border/60 bg-muted/30 p-4 text-[13px]">
      <Row label="Plan" value={data.plan} />
      <Row label="Amount" value={`${data.amount} FCFA`} />
      <Row label="Channel" value={data.channel} />
      <Row label="Reference" value={data.referenceNumber} mono />
      <Row label="Status" value={data.status} />
    </div>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={mono ? "font-mono text-xs text-foreground/90" : "capitalize"}
      >
        {value}
      </span>
    </div>
  );
}

function Actions({
  success,
  reference,
}: {
  success?: boolean;
  reference?: string;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
      {success ? (
        <Button asChild className="w-full sm:w-auto">
          <Link href="/chat">Start chatting</Link>
        </Button>
      ) : (
        <>
          <Button asChild className="w-full sm:w-auto" variant="outline">
            <Link href="/pricing">Try a different plan</Link>
          </Button>
          {reference ? (
            <Button asChild className="w-full sm:w-auto">
              <Link href={`/pricing?retry=${encodeURIComponent(reference)}`}>
                Try again
              </Link>
            </Button>
          ) : null}
        </>
      )}
    </div>
  );
}
