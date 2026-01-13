"use client";

import { useUser } from "@clerk/nextjs";
import {
  Archive,
  ArrowUpRight,
  Bookmark,
  Eye,
  Globe,
  Loader2,
  Plus,
  Star,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useState } from "react";
import { PrefetchLink } from "@/components/prefetch-link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { IS_DEVELOPMENT, ROOT_DOMAIN } from "@/lib/config/public";
import { routes, savesWithFilter } from "@/lib/constants/routes";
import { buildSpaceHostname, buildSpaceUrl } from "@/lib/constants/urls";
import {
  useDeleteSave,
  useGetMySpace,
  useGetStats,
  useGetVisitCount,
  useListSaves,
  useToggleArchive,
  useToggleFavorite,
} from "@/lib/convex";
import { cacheKey, useCachedQuery } from "@/lib/hooks/use-cached-query";
import { usePrefetchTargets } from "@/lib/hooks/use-prefetch";
import { cn, formatNumber } from "@/lib/utils";

function StatCard({
  title,
  value,
  icon: Icon,
  iconClassName,
  href,
}: {
  title: string;
  value: number | string;
  icon: React.ElementType;
  iconClassName?: string;
  href?: string;
}) {
  const content = (
    <Card className="card-hover">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className={cn("h-4 w-4", iconClassName || "text-muted-foreground")} />
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}

function StatsSkeleton() {
  return (
    <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Consistent height for recent saves content area to prevent layout shift
const RECENT_SAVES_MIN_HEIGHT = "min-h-[200px]";

function RecentSavesSkeleton() {
  return (
    <div className={`space-y-2 ${RECENT_SAVES_MIN_HEIGHT}`}>
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 rounded-lg border border-border/60 bg-card p-3"
        >
          <Skeleton className="h-12 w-16 shrink-0 rounded-md" />
          <div className="flex-1 min-w-0 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          {/* Spacer for action buttons area */}
          <Skeleton className="h-8 w-8 shrink-0 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

function PublicSpaceSkeleton() {
  return (
    <Card className="mt-8">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-32" />
        </div>
        <div className="flex items-center gap-4">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <Skeleton className="h-8 w-48 rounded-md" />
      </CardContent>
    </Card>
  );
}

export default function DashboardClient() {
  const { user, isLoaded: userLoaded } = useUser();
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    title: string | null;
    url: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Convex queries - these are reactive and will auto-update
  const rawSpace = useGetMySpace();
  const rawStats = useGetStats();
  const rawRecentSaves = useListSaves({ limit: 5, isArchived: false });
  const rawVisitCount = useGetVisitCount(rawSpace?.id as any);

  // Wrap with stale-while-revalidate cache to eliminate loading flash on navigation
  const space = useCachedQuery("dashboard:space", rawSpace);
  const stats = useCachedQuery("dashboard:stats", rawStats);
  const recentSavesData = useCachedQuery(
    cacheKey("dashboard:recentSaves", { limit: 5, isArchived: false }),
    rawRecentSaves
  );
  const visitCount = useCachedQuery(
    cacheKey("dashboard:visitCount", { spaceId: rawSpace?.id }),
    rawVisitCount
  );

  // Convex mutations
  const toggleFavorite = useToggleFavorite();
  const toggleArchive = useToggleArchive();
  const deleteSaveMutation = useDeleteSave();

  // Prefetch targets for hover intent
  const prefetch = usePrefetchTargets();

  // Memoized prefetch callback for individual saves
  const prefetchSave = useCallback((saveId: string) => () => prefetch.save(saveId), [prefetch]);

  // Only show loading state on first load (no cached data available)
  const isLoading = space === undefined || stats === undefined;
  const recentSaves = recentSavesData?.items;
  const firstName = user?.firstName;

  const handleToggleFavorite = async (saveId: string) => {
    try {
      await toggleFavorite({ saveId: saveId as any });
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
    }
  };

  const handleToggleArchive = async (saveId: string) => {
    try {
      await toggleArchive({ saveId: saveId as any });
    } catch (error) {
      console.error("Failed to toggle archive:", error);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteSaveMutation({ saveId: deleteTarget.id as any });
      setDeleteTarget(null);
    } catch (error) {
      console.error("Failed to delete:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Welcome section */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight h-8 flex items-center">
          {!userLoaded ? (
            <>
              Welcome back
              <Skeleton className="ml-2 h-6 w-24 inline-block" />
            </>
          ) : (
            <>Welcome back{firstName ? `, ${firstName}` : ""}</>
          )}
        </h1>
        <p className="text-muted-foreground">Here's an overview of your collection</p>
      </div>

      {/* Stats grid */}
      {isLoading ? (
        <StatsSkeleton />
      ) : (
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Saves"
            value={formatNumber(stats?.totalSaves ?? 0)}
            icon={Bookmark}
            iconClassName="text-rose-500"
            href={routes.app.saves}
          />
          <StatCard
            title="Public Saves"
            value={formatNumber(stats?.publicSaves ?? 0)}
            icon={Globe}
            iconClassName="text-emerald-500"
            href={savesWithFilter("public")}
          />
          <StatCard
            title="Favorites"
            value={formatNumber(stats?.favoriteSaves ?? 0)}
            icon={Star}
            iconClassName="text-amber"
            href={savesWithFilter("favorites")}
          />
          <StatCard
            title="Visitors"
            value={formatNumber(visitCount?.total ?? 0)}
            icon={Eye}
            iconClassName="text-violet-500"
          />
        </div>
      )}

      {/* Recent saves */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Recent Saves</CardTitle>
          <PrefetchLink href={routes.app.saves} onPrefetch={prefetch.saves}>
            <Button variant="ghost" size="sm">
              View all
              <ArrowUpRight className="ml-1 h-3 w-3" />
            </Button>
          </PrefetchLink>
        </CardHeader>
        <CardContent className={RECENT_SAVES_MIN_HEIGHT}>
          {recentSavesData === undefined ? (
            <RecentSavesSkeleton />
          ) : recentSaves && recentSaves.length > 0 ? (
            <div className="space-y-2">
              {recentSaves.map((save) => (
                <div
                  key={save.id}
                  className="group relative flex items-center rounded-lg border border-border/60 bg-card p-3 transition-all duration-200 hover:border-border hover:bg-accent hover:shadow-sm"
                >
                  {/* Thumbnail - prefetches save details on hover */}
                  <PrefetchLink
                    href={routes.app.save(save.id)}
                    onPrefetch={prefetchSave(save.id)}
                    className="shrink-0"
                  >
                    {save.imageUrl ? (
                      <div className="relative h-12 w-16 rounded-md overflow-hidden">
                        <Image src={save.imageUrl} alt="" fill className="object-cover" />
                      </div>
                    ) : (
                      <div className="flex h-12 w-16 items-center justify-center rounded-md bg-muted">
                        <Bookmark className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                  </PrefetchLink>

                  {/* Content with gradient fade - prefetches save details on hover */}
                  <PrefetchLink
                    href={routes.app.save(save.id)}
                    onPrefetch={prefetchSave(save.id)}
                    className="flex-1 min-w-0 ml-4 mr-2 relative"
                  >
                    <div className="relative">
                      <p className="font-medium truncate pr-8 group-hover:pr-0">
                        {save.title || save.url}
                      </p>
                      {/* Gradient fade overlay on hover */}
                      <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-accent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {save.siteName || new URL(save.url).hostname}
                    </p>
                  </PrefetchLink>

                  {/* Action buttons container - slides in from right */}
                  <div className="flex items-center shrink-0">
                    {/* Archive & Delete - hidden by default, slide in on hover */}
                    <div className="flex items-center gap-0.5 overflow-hidden transition-all duration-200 ease-out w-0 opacity-0 group-hover:w-[68px] group-hover:opacity-100">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.preventDefault();
                          handleToggleArchive(save.id);
                        }}
                        className={cn(
                          "h-8 w-8 rounded-lg text-muted-foreground hover:text-denim",
                          save.isArchived && "bg-denim/10 text-denim"
                        )}
                      >
                        <Archive className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.preventDefault();
                          setDeleteTarget({
                            id: save.id,
                            title: save.title,
                            url: save.url,
                          });
                        }}
                        className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Star button - always visible, part of the sliding group */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.preventDefault();
                        handleToggleFavorite(save.id);
                      }}
                      className={cn(
                        "h-8 w-8 rounded-lg transition-colors",
                        save.isFavorite && "text-amber"
                      )}
                    >
                      <Star className={cn("h-4 w-4", save.isFavorite && "fill-current")} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <Bookmark className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">No saves yet. Add your first link!</p>
              <Link href={routes.app.savesNew} className="mt-4 inline-block">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Save
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Public space preview */}
      {space === undefined ? (
        <PublicSpaceSkeleton />
      ) : space?.visibility === "public" ? (
        <Card className="mt-8">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">Your Public Space</CardTitle>
              <Link
                href={routes.app.settings}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Plus className="h-4 w-4" />
              </Link>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>
                <strong className="text-foreground">{formatNumber(visitCount?.total ?? 0)}</strong>{" "}
                visits
              </span>
              <span>
                <strong className="text-foreground">{formatNumber(stats?.publicSaves ?? 0)}</strong>{" "}
                public
              </span>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap items-center gap-2">
              {/* Base URL */}
              <a
                href={buildSpaceUrl({
                  slug: space.slug,
                  rootDomain: ROOT_DOMAIN,
                  isLocalhost: IS_DEVELOPMENT,
                })}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md border border-border/50 bg-muted/30 px-2.5 py-1.5 text-sm transition-colors hover:bg-muted/50"
              >
                <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                <span>
                  {buildSpaceHostname({
                    slug: space.slug,
                    rootDomain: ROOT_DOMAIN,
                    isLocalhost: IS_DEVELOPMENT,
                  })}
                </span>
                <ArrowUpRight className="h-3 w-3 text-muted-foreground" />
              </a>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this save?</DialogTitle>
            <DialogDescription>
              This will permanently delete "{deleteTarget?.title || deleteTarget?.url}". This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
