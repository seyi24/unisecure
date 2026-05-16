"use client";

import type { UseChatHelpers } from "@ai-sdk/react";
import { MicIcon } from "lucide-react";
import { memo, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import type { ChatMessage } from "@/lib/types";
import { cn } from "@/lib/utils";

function showVoiceBlockedToast(isAnonymous: boolean) {
  if (isAnonymous) {
    toast.error("Sign up and upgrade to Pro for voice mode.", {
      action: {
        label: "Create account",
        onClick: () => {
          window.location.href = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/register`;
        },
      },
    });
    return;
  }

  toast.error("Voice mode is available on the Pro plan.", {
    action: {
      label: "View plans",
      onClick: () => {
        window.location.href = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/pricing`;
      },
    },
  });
}

function PureVoiceModeButton({
  canUseVoiceMode,
  isAnonymous,
  status,
  onTranscript,
}: {
  canUseVoiceMode: boolean;
  isAnonymous: boolean;
  status: UseChatHelpers<ChatMessage>["status"];
  onTranscript: (text: string, isFinal: boolean) => void;
}) {
  const isInteractive = status === "ready";

  const { isListening, isSupported, toggle, stop } = useSpeechRecognition({
    onTranscript,
    onError: (message) => {
      toast.error(message);
    },
  });

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();

      if (!canUseVoiceMode) {
        showVoiceBlockedToast(isAnonymous);
        return;
      }

      if (!isSupported) {
        toast.error(
          "Voice input is not supported in this browser. Try Chrome or Edge."
        );
        return;
      }

      if (!isInteractive) {
        return;
      }

      toggle();
    },
    [canUseVoiceMode, isAnonymous, isInteractive, isSupported, toggle]
  );

  useEffect(() => {
    if (status !== "ready" && isListening) {
      stop();
    }
  }, [status, isListening, stop]);

  const isActive = isListening && canUseVoiceMode;

  return (
    <Button
      aria-label={isActive ? "Stop voice input" : "Start voice input"}
      aria-pressed={isActive}
      className={cn(
        "relative h-7 w-7 rounded-lg border border-border/40 p-1 transition-colors",
        isActive
          ? "border-red-500/50 bg-red-500/10 text-red-500 hover:border-red-500/60 hover:text-red-500"
          : canUseVoiceMode && isInteractive && isSupported
            ? "text-foreground hover:border-border hover:text-foreground"
            : "text-muted-foreground/30 cursor-not-allowed"
      )}
      data-testid="voice-mode-button"
      disabled={!isInteractive}
      onClick={handleClick}
      title={
        !canUseVoiceMode
          ? "Pro plan required for voice mode"
          : !isSupported
            ? "Voice input not supported in this browser"
            : isActive
              ? "Stop listening"
              : "Voice input"
      }
      type="button"
      variant="ghost"
    >
      {isActive ? (
        <span className="absolute inset-0 animate-ping rounded-lg bg-red-500/20" />
      ) : null}
      <MicIcon className="relative size-3.5" />
    </Button>
  );
}

export const VoiceModeButton = memo(PureVoiceModeButton);
