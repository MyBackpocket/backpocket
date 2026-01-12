"use client";

import { useEffect, useRef, useState } from "react";
import { useGetMySpace, useEnsureSpace } from "@/lib/convex";
import { AppSidebar } from "./app-sidebar";
import { MobileHeader } from "./mobile-header";

interface AppShellProps {
  children: React.ReactNode;
}

/**
 * Client-side shell that manages mobile navigation state.
 * Space data is fetched via Convex (real-time updates).
 * Automatically creates user's space on first app access.
 */
export function AppShell({ children }: AppShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const space = useGetMySpace();
  const ensureSpace = useEnsureSpace();
  const hasCalledEnsureSpace = useRef(false);

  // Auto-create space for new users
  // space === undefined means loading, null means no space exists
  useEffect(() => {
    if (space === null && !hasCalledEnsureSpace.current) {
      hasCalledEnsureSpace.current = true;
      ensureSpace();
    }
  }, [space, ensureSpace]);

  // Transform Convex response to match expected shape
  const spaceData = space
    ? {
        id: space.id,
        type: space.type as "personal" | "org",
        slug: space.slug,
        name: space.name,
        bio: space.bio,
        avatarUrl: space.avatarUrl,
        visibility: space.visibility as "public" | "private",
        publicLayout: space.publicLayout as "list" | "grid",
        defaultSaveVisibility: space.defaultSaveVisibility as "public" | "private",
        createdAt: new Date(space.createdAt),
        updatedAt: new Date(space.updatedAt),
      }
    : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile nav overlay */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      {/* Sidebar */}
      <AppSidebar
        space={spaceData}
        domains={[]} // Custom domains can be added later if needed
        isOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
      />

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar (mobile) */}
        <MobileHeader onOpenMenu={() => setMobileNavOpen(true)} />

        {/* Page content */}
        <main className="min-h-[calc(100vh-4rem)] lg:min-h-screen">{children}</main>
      </div>
    </div>
  );
}
