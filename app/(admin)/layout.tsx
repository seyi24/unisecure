import type { ReactNode } from "react";

import { Toaster } from "@/components/ui/sonner";
import { PREFERENCE_DEFAULTS } from "@/lib/preferences/preferences-config";
import { fontVars } from "@/lib/fonts/registry";
import { PreferencesStoreProvider } from "@/stores/preferences/preferences-provider";
import { ThemeBootScript } from "@/scripts/theme-boot";

export default function AdminGroupLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const {
    theme_mode,
    theme_preset,
    content_layout,
    navbar_style,
    font,
  } = PREFERENCE_DEFAULTS;

  return (
    <div className={`admin-root ${fontVars} min-h-screen`}>
      <ThemeBootScript />
      <PreferencesStoreProvider
        themeMode={theme_mode}
        themePreset={theme_preset}
        contentLayout={content_layout}
        navbarStyle={navbar_style}
        font={font}
      >
        {children}
        <Toaster />
      </PreferencesStoreProvider>
    </div>
  );
}
