"use client";

import {
  Bookmark,
  ExternalLink,
  FolderOpen,
  Globe,
  LayoutDashboard,
  Pencil,
  Settings,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { UserButton } from "@/components/auth-components";
import { Logo } from "@/components/logo";
import { PrefetchLink } from "@/components/prefetch-link";
import { QuickAdd } from "@/components/quick-add";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { IS_DEVELOPMENT, ROOT_DOMAIN } from "@/lib/config/public";
import { routes } from "@/lib/constants/routes";
import { buildSpaceHostname, buildSpaceUrl } from "@/lib/constants/urls";
import { usePrefetchTargets } from "@/lib/hooks/use-prefetch";
import type { DomainMapping, Space } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Custom event name for focusing the space name input on settings page */
export const FOCUS_SPACE_NAME_EVENT = "focus-space-name";

const navigation = [
  { name: "Dashboard", href: routes.app.root, icon: LayoutDashboard },
  { name: "Saves", href: routes.app.saves, icon: Bookmark },
  { name: "Collections", href: routes.app.collections, icon: FolderOpen },
];

interface SpaceLinksDropdownProps {
  space: Space;
  domains: DomainMapping[];
}

function SpaceLinksDropdown({ space, domains }: SpaceLinksDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const primaryUrl = buildSpaceUrl({
    slug: space.slug,
    rootDomain: ROOT_DOMAIN,
    isLocalhost: IS_DEVELOPMENT,
  });
  const primaryHostname = buildSpaceHostname({
    slug: space.slug,
    rootDomain: ROOT_DOMAIN,
    isLocalhost: IS_DEVELOPMENT,
  });

  const allLinks = [
    { id: "primary", url: primaryUrl, hostname: primaryHostname },
    ...domains.map((d) => ({
      id: d.id,
      url: `https://${d.domain}`,
      hostname: d.domain,
    })),
  ];

  const hasMultipleLinks = allLinks.length > 1;

  return (
    <div
      className="relative mt-1"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      {/* Main link trigger */}
      <a
        href={primaryUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 group"
      >
        <span className="truncate">{primaryHostname}</span>
        {hasMultipleLinks && (
          <span className="text-[10px] text-muted-foreground/60 shrink-0">
            +{allLinks.length - 1}
          </span>
        )}
        <ExternalLink className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
      </a>

      {/* Dropdown menu - appears on hover */}
      {hasMultipleLinks && isOpen && (
        <div className="absolute bottom-full left-0 right-0 pb-2 z-50">
          {/* Actual dropdown content */}
          <div className="min-w-[200px] max-w-[280px] rounded-lg border border-denim/15 bg-card shadow-lg py-1 animate-in fade-in-0 slide-in-from-bottom-2 duration-150">
            <div className="px-2 py-1.5 text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider flex items-center gap-1.5">
              <Globe className="h-3 w-3" />
              Space Links
            </div>
            {allLinks.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors group"
              >
                <span className="truncate flex-1">{link.hostname}</span>
                <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface AppSidebarProps {
  space: Space | null;
  domains?: DomainMapping[];
  isOpen: boolean;
  onClose: () => void;
}

export function AppSidebar({ space, domains = [], isOpen, onClose }: AppSidebarProps) {
  const pathname = usePathname();
  const isOnSettingsPage = pathname === routes.app.settings;
  const prefetch = usePrefetchTargets();

  // Map navigation items to their prefetch functions
  const prefetchMap = useMemo(
    () =>
      ({
        [routes.app.root]: prefetch.stats,
        [routes.app.saves]: prefetch.saves,
        [routes.app.collections]: prefetch.collections,
      }) as Record<string, (() => void) | undefined>,
    [prefetch]
  );

  /**
   * Handle clicking the edit space name pencil icon.
   * If already on settings page, focus the name input instead of navigating.
   */
  const handleEditSpaceName = useCallback(
    (e: React.MouseEvent) => {
      if (isOnSettingsPage) {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent(FOCUS_SPACE_NAME_EVENT));
      } else {
        // Navigate to settings - the Link handles this
      }
    },
    [isOnSettingsPage]
  );

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 transform border-r border-denim/15 bg-card transition-transform duration-200 lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-denim/15 px-4">
          <Link href={routes.app.root} className="flex items-center gap-2">
            <Logo size="md" />
          </Link>
          <div className="flex items-center gap-1">
            <div className="hidden lg:block">
              <ThemeSwitcher />
            </div>
            <button
              type="button"
              className="lg:hidden text-muted-foreground hover:text-foreground"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Quick Add Button */}
        <div className="p-4">
          <QuickAdd />
        </div>

        {/* Navigation - uses PrefetchLink to preload data on hover */}
        <nav className="flex-1 space-y-1 px-3">
          {navigation.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== routes.app.root && pathname.startsWith(item.href));
            return (
              <PrefetchLink
                key={item.name}
                href={item.href}
                onClick={onClose}
                onPrefetch={prefetchMap[item.href]}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-denim/10 text-denim-deep"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <item.icon className={cn("h-5 w-5", isActive && "text-rust")} />
                {item.name}
              </PrefetchLink>
            );
          })}
        </nav>

        {/* Settings - latched to bottom */}
        <div className="px-3 pb-2">
          <Link
            href={routes.app.settings}
            onClick={onClose}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              pathname === routes.app.settings
                ? "bg-denim/10 text-denim-deep"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <Settings className={cn("h-5 w-5", pathname === routes.app.settings && "text-rust")} />
            Settings
          </Link>
        </div>

        {/* User section */}
        <div className="border-t border-denim/15 p-4">
          <div className="flex items-center gap-3">
            <UserButton
              sizeClassName="h-9 w-9"
              appearance={{
                elements: {
                  avatarBox: "h-9 w-9",
                },
              }}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-medium">{space?.name ?? "Your Space"}</p>
                <Link
                  href={routes.app.settings}
                  onClick={handleEditSpaceName}
                  className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                  title="Edit space settings"
                >
                  <Pencil className="h-3 w-3" />
                </Link>
              </div>
              {space?.slug ? (
                <SpaceLinksDropdown space={space} domains={domains} />
              ) : (
                <Link
                  href={routes.app.settings}
                  onClick={handleEditSpaceName}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 mt-1"
                >
                  <span>Set up your space</span>
                  <Pencil className="h-3 w-3" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
