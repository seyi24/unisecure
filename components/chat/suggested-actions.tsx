"use client";

import type { UseChatHelpers } from "@ai-sdk/react";
import { motion } from "framer-motion";
import { RotateCcw } from "lucide-react";
import { memo, useCallback, useEffect, useState } from "react";
import useSWR from "swr";

import type { ChatSuggestionsResponse } from "@/app/(chat)/api/chat/suggestions/route";
import { Button } from "@/components/ui/button";
import type { ChatMessage } from "@/lib/types";
import type { VisibilityType } from "@/lib/types";
import { Suggestion } from "../ai-elements/suggestion";

type SuggestedActionsProps = {
  chatId: string;
  sendMessage: UseChatHelpers<ChatMessage>["sendMessage"];
  selectedVisibilityType: VisibilityType;
};

const fetcher = (url: string) =>
  fetch(url).then((response) => {
    if (!response.ok) {
      throw new Error("Failed to fetch suggestions");
    }
    return response.json() as Promise<ChatSuggestionsResponse>;
  });

function SuggestionSkeleton() {
  return (
    <div className="h-[52px] animate-pulse rounded-xl border border-border/40 bg-muted/40 sm:h-[72px]" />
  );
}

function PureSuggestedActions({ chatId, sendMessage }: SuggestedActionsProps) {
  const [seed, setSeed] = useState(() => Date.now());
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const apiUrl = `${basePath}/api/chat/suggestions?chatId=${chatId}&seed=${seed}`;

  useEffect(() => {
    setSeed(Date.now());
  }, [chatId]);

  const { data, error, isLoading, isValidating, mutate } = useSWR(
    apiUrl,
    fetcher,
    {
      revalidateOnFocus: true,
      dedupingInterval: 10_000,
    }
  );

  const refresh = useCallback(() => {
    setSeed(Date.now());
    void mutate();
  }, [mutate]);

  const suggestedActions = data?.suggestions ?? [];
  const showSkeleton = isLoading && suggestedActions.length === 0;
  const showEmpty = !showSkeleton && (error || suggestedActions.length === 0);

  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex items-center justify-end gap-1 px-0.5">
        <Button
          aria-label="Get new suggested questions"
          className="h-7 gap-1.5 px-2 text-[11px] text-muted-foreground"
          disabled={isValidating}
          onClick={refresh}
          type="button"
          variant="ghost"
        >
          <RotateCcw
            className={`size-3 ${isValidating ? "animate-spin" : ""}`}
          />
          New ideas
        </Button>
      </div>

      <div
        className="flex w-full gap-2.5 overflow-x-auto pb-1 sm:grid sm:grid-cols-2 sm:overflow-visible"
        data-testid="suggested-actions"
        style={{
          scrollbarWidth: "none",
          WebkitOverflowScrolling: "touch",
          msOverflowStyle: "none",
        }}
      >
        {showSkeleton
          ? Array.from({ length: 4 }, (_, index) => (
              <div
                className="min-w-[200px] shrink-0 sm:min-w-0 sm:shrink"
                key={`skeleton-${index}`}
              >
                <SuggestionSkeleton />
              </div>
            ))
          : null}

        {showEmpty
          ? Array.from({ length: 4 }, (_, index) => (
              <div
                className="min-w-[200px] shrink-0 sm:min-w-0 sm:shrink"
                key={`empty-${index}`}
              >
                <SuggestionSkeleton />
              </div>
            ))
          : null}

        {suggestedActions.map((suggestedAction, index) => (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="min-w-[200px] shrink-0 sm:min-w-0 sm:shrink"
            exit={{ opacity: 0, y: 16 }}
            initial={{ opacity: 0, y: 16 }}
            key={suggestedAction}
            transition={{
              delay: 0.06 * index,
              duration: 0.4,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <Suggestion
              className="h-auto w-full whitespace-nowrap rounded-xl border border-border/50 bg-card/30 px-4 py-3 text-left text-[12px] leading-relaxed text-muted-foreground transition-all duration-200 sm:whitespace-normal sm:p-4 sm:text-[13px] hover:-translate-y-0.5 hover:bg-card/60 hover:text-foreground hover:shadow-[var(--shadow-card)]"
              onClick={(suggestion) => {
                window.history.pushState(
                  {},
                  "",
                  `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/chat/${chatId}`
                );
                sendMessage({
                  role: "user",
                  parts: [{ type: "text", text: suggestion }],
                });
              }}
              suggestion={suggestedAction}
            >
              {suggestedAction}
            </Suggestion>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export const SuggestedActions = memo(
  PureSuggestedActions,
  (prevProps, nextProps) => {
    if (prevProps.chatId !== nextProps.chatId) {
      return false;
    }
    if (prevProps.selectedVisibilityType !== nextProps.selectedVisibilityType) {
      return false;
    }

    return true;
  }
);
