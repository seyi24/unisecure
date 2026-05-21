"use client";

import { SparklesIcon } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import useSWR from "swr";
import type { UsageResponse } from "@/app/(chat)/api/usage/route";
import { PlanBadge } from "@/components/admin/plan-badge";
import { cn } from "@/lib/utils";

const fetcher = (url: string) =>
  fetch(url).then((response) => {
    if (!response.ok) {
      throw new Error("Failed to fetch usage");
    }
    return response.json() as Promise<UsageResponse>;
  });

type UsageIndicatorProps = {
  refreshKey?: number;
};

export function UsageIndicator({ refreshKey }: UsageIndicatorProps) {
  const apiUrl = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/usage`;
  const { data, mutate } = useSWR<UsageResponse>(apiUrl, fetcher, {
    revalidateOnFocus: false,
    refreshInterval: 0,
  });

  useEffect(() => {
    mutate();
  }, [mutate, refreshKey]);

  if (!data) {
    return null;
  }

  const isLow = data.remaining <= Math.max(1, Math.floor(data.limit * 0.34));

  if (data.isAnonymous) {
    return (
      <div className="flex w-full items-center justify-between gap-2 rounded-xl border border-violet-400/30 bg-violet-500/5 px-3 py-2 text-[12px] text-foreground/85">
        <span className="flex items-center gap-2">
          <SparklesIcon className="size-3.5 text-violet-400" />
          <span>
            <span className="font-medium text-foreground">Guest mode</span>
            <span className="mx-1.5 text-muted-foreground/60">·</span>
            <span>
              {data.remaining} of {data.limit} free questions left
            </span>
          </span>
        </span>
        <Link
          className="rounded-md bg-violet-500 px-2.5 py-1 font-medium text-white transition-colors hover:bg-violet-400"
          href="/register"
        >
          Create free account
        </Link>
      </div>
    );
  }

  const showUpgrade =
    data.plan === "free" || data.plan === "starter" || isLow;

  return (
    <div
      className={cn(
        "flex w-full items-center justify-between gap-2 rounded-xl border border-border/40 bg-muted/30 px-3 py-2 text-[12px] text-muted-foreground",
        isLow && "border-amber-400/30 bg-amber-500/5 text-foreground/85",
        data.plan === "elite" && "border-amber-400/20 bg-amber-500/5"
      )}
    >
      <span className="flex min-w-0 items-center gap-2">
        <PlanBadge className="shrink-0" plan={data.plan} />
        <span className="truncate">
          {data.remaining} of {data.limit} questions left today
        </span>
      </span>
      {showUpgrade ? (
        <Link
          className="shrink-0 rounded-md border border-border/60 px-2.5 py-1 text-foreground transition-colors hover:bg-muted"
          href="/pricing"
        >
          Upgrade
        </Link>
      ) : null}
    </div>
  );
}
