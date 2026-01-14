"use client";

import { ThemeProvider, useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { ConvexClientProvider } from "@/components/convex-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ROOT_DOMAIN } from "@/lib/config/public";
import { THEME_COOKIE_NAME } from "@/lib/constants/storage";

// Get the root domain for cookie (e.g., ".backpocket.my" for cross-subdomain)
function getCookieDomain(): string {
  if (typeof window === "undefined") return "";
  const hostname = window.location.hostname;

  // For localhost, don't set domain (cookies work across ports automatically)
  if (hostname === "localhost" || hostname.endsWith(".localhost")) {
    return "";
  }

  // For the main domain and subdomains, use the root domain with leading dot
  return `.${ROOT_DOMAIN}`;
}

// Read theme from cookie
function getThemeFromCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(^| )${THEME_COOKIE_NAME}=([^;]+)`));
  return match ? match[2] : null;
}

// Set theme cookie with cross-subdomain support
function setThemeCookie(theme: string) {
  if (typeof document === "undefined") return;

  const domain = getCookieDomain();
  const domainPart = domain ? `; domain=${domain}` : "";
  const maxAge = 60 * 60 * 24 * 365; // 1 year

  // biome-ignore lint/suspicious/noDocumentCookie: Cookie Store API has limited browser support; document.cookie is the reliable cross-browser approach
  document.cookie = `${THEME_COOKIE_NAME}=${theme}; path=/${domainPart}; max-age=${maxAge}; SameSite=Lax`;
}

// Component that syncs theme changes to cookie
function ThemeCookieSync() {
  const { theme, setTheme } = useTheme();
  const [initialized, setInitialized] = useState(false);

  // On mount, read theme from cookie and apply if different from localStorage
  // biome-ignore lint/correctness/useExhaustiveDependencies: Intentionally runs only once on mount to sync cookie → state; adding theme/setTheme would cause infinite loops or unnecessary reruns
  useEffect(() => {
    const cookieTheme = getThemeFromCookie();
    if (cookieTheme && cookieTheme !== theme) {
      setTheme(cookieTheme);
    }
    setInitialized(true);
  }, []);

  // Sync theme changes to cookie
  useEffect(() => {
    if (initialized && theme) {
      setThemeCookie(theme);
    }
  }, [theme, initialized]);

  return null;
}

interface ProvidersProps {
  children: React.ReactNode;
  /**
   * If true, skip Clerk auth integration.
   * Used for custom domain requests where Clerk is not available.
   */
  skipClerk?: boolean;
}

export function Providers({ children, skipClerk = false }: ProvidersProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <ThemeCookieSync />
      <ConvexClientProvider skipClerk={skipClerk}>
        <TooltipProvider>{children}</TooltipProvider>
      </ConvexClientProvider>
    </ThemeProvider>
  );
}
