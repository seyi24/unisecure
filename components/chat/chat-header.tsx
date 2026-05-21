"use client";

import { PanelLeftIcon } from "lucide-react";
import Link from "next/link";
import { memo } from "react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import { Logo } from "@/components/logo";
import { UserPlanBadge } from "@/components/chat/user-plan-badge";

function PureChatHeader() {
  const { state, toggleSidebar, isMobile } = useSidebar();

  if (state === "collapsed" && !isMobile) {
    return null;
  }

  return (
    <header className="sticky top-0 flex h-14 items-center gap-2 bg-sidebar px-3">
      <Button
        className="md:hidden"
        onClick={toggleSidebar}
        size="icon-sm"
        variant="ghost"
      >
        <PanelLeftIcon className="size-4" />
      </Button>

      <Link
        className="flex size-8 items-center justify-center rounded-lg md:hidden"
        href="/"
      >
        <Logo size={50} />
      </Link>

      <div className="ml-auto flex items-center gap-2">
        <UserPlanBadge />
        <Button
          asChild
          className="hidden rounded-lg bg-foreground px-4 text-background hover:bg-foreground/90 md:flex"
        >
        <Link
          href="mailto:unisecure7@gmail.com"
          rel="noopener noreferrer"
        >
         
          Contact Support
        </Link>
        </Button>
      </div>
    </header>
  );
}

export const ChatHeader = memo(PureChatHeader);
