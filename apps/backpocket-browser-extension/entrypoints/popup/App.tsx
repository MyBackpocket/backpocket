import logoImg from "@/assets/img/Backpocket-Logo-128.png";
import { QuickSaveView } from "../../components/QuickSaveView";
import { ThemePicker } from "../../components/ThemePicker";
import {
  AuthenticatedView,
  AuthProvider,
  isMockAuth,
  UnauthenticatedView,
  UserButton,
} from "../../lib/auth";
import { ThemeProvider } from "../../lib/theme";

// Web app URL for sign-in (OAuth doesn't work directly in extension popups)
const WEB_APP_URL = import.meta.env.VITE_WEB_APP_URL || "http://localhost:3000";

function SignedOutView() {
  function handleSignIn() {
    // Open web app for sign-in - session syncs back via syncHost
    browser.tabs.create({ url: `${WEB_APP_URL}/sign-in` });
  }

  return (
    <div className="flex flex-col items-center justify-center gap-5 px-5 py-10 text-center">
      <div className="flex flex-col items-center gap-4">
        {/* biome-ignore lint/performance/noImgElement: browser extension, not Next.js */}
        <img src={logoImg} alt="Backpocket" className="size-16 rounded-xl drop-shadow-lg" />
        <h1 className="text-xl font-semibold tracking-tight text-[var(--text-primary)]">
          Backpocket
        </h1>
      </div>
      <p className="text-base text-[var(--text-muted)]">Sign in to save links</p>
      <button
        type="button"
        onClick={handleSignIn}
        className="rounded-xl bg-[var(--accent)] px-7 py-3 text-base font-medium text-white transition-all hover:bg-[var(--accent-hover)] active:scale-[0.98]"
      >
        Sign In
      </button>
      <p className="mt-2 text-xs text-[var(--text-muted)]">Opens backpocket.my to sign in</p>
    </div>
  );
}

function SignedInView() {
  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* biome-ignore lint/performance/noImgElement: browser extension, not Next.js */}
          <img src={logoImg} alt="Backpocket" className="size-7 rounded-lg" />
          <h1 className="text-base font-semibold tracking-tight text-[var(--text-primary)]">
            Backpocket
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <ThemePicker />
          {isMockAuth ? (
            <div className="rounded-lg bg-[var(--bg-muted)] px-2.5 py-1 text-[10px] font-semibold tracking-wider text-[var(--text-muted)]">
              DEV
            </div>
          ) : (
            <UserButton />
          )}
        </div>
      </header>

      <QuickSaveView />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <div className="w-[360px] min-h-[520px] p-5 bg-[var(--bg-primary)]">
          <UnauthenticatedView>
            <SignedOutView />
          </UnauthenticatedView>
          <AuthenticatedView>
            <SignedInView />
          </AuthenticatedView>
        </div>
      </AuthProvider>
    </ThemeProvider>
  );
}
