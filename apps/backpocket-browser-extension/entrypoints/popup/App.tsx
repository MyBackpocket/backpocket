import { useCallback, useEffect, useState } from "react";
import logoImg from "@/assets/img/Backpocket-Logo-128.png";
import { SettingsIcon } from "../../components/Icons";
import { QuickSaveView } from "../../components/QuickSaveView";
import { SettingsPanel } from "../../components/SettingsPanel";
import {
  AuthenticatedView,
  AuthLoadingView,
  AuthProvider,
  syncTokenToStorage,
  UnauthenticatedView,
  UserButton,
  useAuth,
  useSessionRefresh,
} from "../../lib/auth";
import { SettingsProvider, useSettings } from "../../lib/settings-context";
import { ThemeProvider } from "../../lib/theme";

// Web app URL for sign-in (OAuth doesn't work directly in extension popups)
const WEB_APP_URL = import.meta.env.VITE_WEB_APP_URL || "http://localhost:3000";

/**
 * Component that syncs auth token to session storage for background script access.
 * Must be placed inside AuthProvider to access Clerk context.
 */
function TokenSyncer() {
  const { getToken, isSignedIn, isLoaded } = useAuth();

  useEffect(() => {
    if (!isLoaded) return;

    async function syncToken() {
      if (isSignedIn) {
        const token = await getToken();
        await syncTokenToStorage(token);
      } else {
        await syncTokenToStorage(null);
      }
    }

    syncToken();
  }, [isSignedIn, isLoaded, getToken]);

  return null;
}

function LoadingView() {
  return (
    <div className="flex flex-col items-center justify-center gap-5 px-6 py-16 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-[var(--bg-muted)]">
        {/* biome-ignore lint/performance/noImgElement: browser extension, not Next.js */}
        <img src={logoImg} alt="Backpocket" className="size-10 rounded-xl animate-pulse" />
      </div>
      <p className="text-base text-[var(--text-muted)]">Loading...</p>
    </div>
  );
}

function SignedOutView() {
  function handleSignIn() {
    // Open web app for sign-in - session syncs back via syncHost
    browser.tabs.create({ url: `${WEB_APP_URL}/sign-in` });
  }

  return (
    <div className="flex flex-col items-center justify-center gap-6 px-6 py-12 text-center">
      <div className="flex flex-col items-center gap-4">
        {/* biome-ignore lint/performance/noImgElement: browser extension, not Next.js */}
        <img src={logoImg} alt="Backpocket" className="size-20 rounded-2xl shadow-lg" />
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
          Backpocket
        </h1>
      </div>

      <p className="text-base text-[var(--text-secondary)]">Save links to your personal library</p>

      <button
        type="button"
        onClick={handleSignIn}
        className="w-full rounded-[var(--radius-md)] bg-[var(--accent)] px-6 py-3.5 text-base font-semibold text-white shadow-md transition-all hover:bg-[var(--accent-hover)] hover:shadow-lg active:scale-[0.98]"
      >
        Sign In to Continue
      </button>

      <div className="mt-2 space-y-2">
        <p className="text-sm text-[var(--text-muted)]">Opens backpocket.my to sign in</p>
        <p className="text-xs text-[var(--text-muted)]">Your session will sync automatically</p>
      </div>

      <TroubleshootingHint />
    </div>
  );
}

function TroubleshootingHint() {
  const { refreshSession, isRefreshing } = useSessionRefresh();

  return (
    <div className="mt-4 w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-tertiary)] p-4">
      <p className="mb-2 text-xs font-medium text-[var(--text-secondary)]">Having trouble?</p>
      <p className="mb-3 text-xs leading-relaxed text-[var(--text-muted)]">
        If you're already signed in on the web but the extension doesn't recognize you, try
        refreshing the session.
      </p>
      <button
        type="button"
        onClick={refreshSession}
        disabled={isRefreshing}
        className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-input)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] transition-all hover:border-[var(--text-muted)] hover:bg-[var(--bg-muted)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isRefreshing ? "Refreshing..." : "Refresh Session"}
      </button>
    </div>
  );
}

function SignedInView() {
  const [view, setView] = useState<"main" | "settings">("main");

  const handleOpenSettings = useCallback(() => setView("settings"), []);
  const handleCloseSettings = useCallback(() => setView("main"), []);

  if (view === "settings") {
    return <SettingsPanel onBack={handleCloseSettings} />;
  }

  return (
    <div className="flex flex-col gap-3">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {/* biome-ignore lint/performance/noImgElement: browser extension, not Next.js */}
          <img src={logoImg} alt="Backpocket" className="size-7 rounded-[var(--radius-sm)]" />
          <h1 className="text-base font-semibold tracking-tight text-[var(--text-primary)]">
            Backpocket
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleOpenSettings}
            className="flex items-center justify-center rounded-[var(--radius-sm)] p-2 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]"
            aria-label="Settings"
          >
            <SettingsIcon className="size-4" />
          </button>
          <UserButton />
        </div>
      </header>

      <QuickSaveView />
    </div>
  );
}

/**
 * Theme bridge component that connects settings context to theme provider.
 * Must be rendered inside both AuthProvider and SettingsProvider.
 */
function ThemedContent() {
  const { settings, updateSetting } = useSettings();

  const handleThemeChange = useCallback(
    (theme: "light" | "dark" | "system") => {
      updateSetting("theme", theme);
    },
    [updateSetting]
  );

  return (
    <ThemeProvider externalTheme={settings.theme} onThemeChange={handleThemeChange}>
      <div className="w-[380px] p-4 bg-[var(--bg-primary)]">
        <AuthLoadingView>
          <LoadingView />
        </AuthLoadingView>
        <UnauthenticatedView>
          <SignedOutView />
        </UnauthenticatedView>
        <AuthenticatedView>
          <SignedInView />
        </AuthenticatedView>
      </div>
    </ThemeProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      {/* Sync auth token to session storage for background script */}
      <TokenSyncer />
      <SettingsProvider>
        <ThemedContent />
      </SettingsProvider>
    </AuthProvider>
  );
}
