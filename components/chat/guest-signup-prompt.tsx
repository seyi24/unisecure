"use client";

import { LockIcon, SparklesIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

type GuestSignupPromptProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const benefits = [
  "More daily questions (5–50 depending on plan)",
  "Chat history saved across devices",
  "File uploads & voice mode on Pro plan",
  "Premium AI models",
  "Personalized cybersecurity recommendations",
];

export function GuestSignupPrompt({
  open,
  onOpenChange,
}: GuestSignupPromptProps) {
  const router = useRouter();

  return (
    <AlertDialog onOpenChange={onOpenChange} open={open}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex size-10 items-center justify-center rounded-full bg-violet-500/15 text-violet-400">
            <SparklesIcon className="size-5" />
          </div>
          <AlertDialogTitle>You're on a roll!</AlertDialogTitle>
          <AlertDialogDescription>
            Create a free account to keep chatting and unlock more powerful
            features for your cybersecurity learning.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <ul className="my-2 space-y-2 text-sm text-foreground/90">
          {benefits.map((benefit) => (
            <li className="flex items-start gap-2" key={benefit}>
              <LockIcon className="mt-0.5 size-3.5 shrink-0 text-violet-400" />
              <span>{benefit}</span>
            </li>
          ))}
        </ul>

        <AlertDialogFooter className="gap-2 sm:gap-2">
          <Button
            asChild
            className="w-full sm:w-auto"
            onClick={() => onOpenChange(false)}
            variant="outline"
          >
            <Link href="/login">Sign in</Link>
          </Button>
          <Button
            className="w-full bg-violet-500 text-white hover:bg-violet-400 sm:w-auto"
            onClick={() => {
              onOpenChange(false);
              router.push("/register");
            }}
            type="button"
          >
            Create free account
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
