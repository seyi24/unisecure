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
import { userPlans } from "@/lib/db/schema";

export function UsersFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const search = searchParams.get("q") ?? "";
  const plan = searchParams.get("plan") ?? "all";
  const accountType = searchParams.get("type") ?? "all";

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
      router.push(`/admin/users?${params.toString()}`);
    });
  };

  return (
    <form
      className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end"
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        updateParams({ q: String(formData.get("q") ?? "") });
      }}
    >
      <div className="flex min-w-[200px] flex-1 flex-col gap-1.5">
        <label className="font-medium text-sm" htmlFor="user-search">
          Search
        </label>
        <Input
          defaultValue={search}
          id="user-search"
          name="q"
          placeholder="Email or name…"
          type="search"
        />
      </div>
      <div className="flex w-full flex-col gap-1.5 sm:w-40">
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
        <span className="font-medium text-sm">Account</span>
        <Select
          onValueChange={(value) => updateParams({ type: value })}
          value={accountType}
        >
          <SelectTrigger>
            <SelectValue placeholder="All accounts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All accounts</SelectItem>
            <SelectItem value="registered">Registered</SelectItem>
            <SelectItem value="guest">Guest</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button disabled={isPending} type="submit">
        {isPending ? "Loading…" : "Search"}
      </Button>
    </form>
  );
}
