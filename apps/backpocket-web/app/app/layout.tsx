import { AppShell } from "./_components/app-shell";

// Force dynamic rendering to ensure fresh auth state
export const dynamic = "force-dynamic";

/**
 * Layout for the authenticated app.
 * Data fetching happens client-side via Convex (real-time).
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
