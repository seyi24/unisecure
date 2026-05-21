"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { paymentStatuses, userPlans } from "@/lib/db/schema";
import { PAIEMENT_PRO_CHANNELS } from "@/lib/payment/plans";

export function PaymentsFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const search = searchParams.get("q") ?? "";
  const status = searchParams.get("status") ?? "all";
  const plan = searchParams.get("plan") ?? "all";
  const channel = searchParams.get("channel") ?? "all";

  const updateParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }
    params.delete("page");
    startTransition(() => {
      router.push(`/admin/payments?${params.toString()}`);
    });
  };

  return (
    <form
      className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end"
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        updateParams({ q: String(formData.get("q") ?? "") });
      }}
    >
      <div className="flex min-w-[200px] flex-1 flex-col gap-1.5">
        <label className="font-medium text-sm" htmlFor="payment-search">
          Search
        </label>
        <Input
          defaultValue={search}
          id="payment-search"
          name="q"
          placeholder="Reference, email…"
          type="search"
        />
      </div>
      <div className="flex w-full flex-col gap-1.5 sm:w-36">
        <span className="font-medium text-sm">Status</span>
        <Select
          onValueChange={(value) => updateParams({ status: value })}
          value={status}
        >
          <SelectTrigger>
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {paymentStatuses.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex w-full flex-col gap-1.5 sm:w-36">
        <span className="font-medium text-sm">Plan</span>
        <Select
          onValueChange={(value) => updateParams({ plan: value })}
          value={plan}
        >
          <SelectTrigger>
            <SelectValue placeholder="All plans" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All plans</SelectItem>
            {userPlans.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex w-full flex-col gap-1.5 sm:w-44">
        <span className="font-medium text-sm">Channel</span>
        <Select
          onValueChange={(value) => updateParams({ channel: value })}
          value={channel}
        >
          <SelectTrigger>
            <SelectValue placeholder="All channels" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All channels</SelectItem>
            {PAIEMENT_PRO_CHANNELS.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button disabled={isPending} type="submit">
        {isPending ? "Loading…" : "Search"}
      </Button>
    </form>
  );
}
