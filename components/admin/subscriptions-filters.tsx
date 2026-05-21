"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { userPlans } from "@/lib/db/schema";

export function SubscriptionsFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const filter = searchParams.get("filter") ?? "all";
  const plan = searchParams.get("plan") ?? "all";

  const updateParams = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === "all") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }
    params.delete("page");
    startTransition(() => {
      const qs = params.toString();
      router.push(qs ? `/admin/subscriptions?${qs}` : "/admin/subscriptions");
    });
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex w-full flex-col gap-1.5 sm:w-48">
        <span className="font-medium text-sm">Status</span>
        <Select
          disabled={isPending}
          onValueChange={(value) => updateParams({ filter: value })}
          value={filter}
        >
          <SelectTrigger>
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All paid accounts</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="expiring">Expiring (7 days)</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex w-full flex-col gap-1.5 sm:w-40">
        <span className="font-medium text-sm">Plan</span>
        <Select
          disabled={isPending}
          onValueChange={(value) => updateParams({ plan: value })}
          value={plan}
        >
          <SelectTrigger>
            <SelectValue placeholder="All plans" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All plans</SelectItem>
            {userPlans
              .filter((p) => p !== "free")
              .map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
