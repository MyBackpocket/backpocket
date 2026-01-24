"use client";

import {
  Archive,
  Bookmark,
  Calendar,
  Check,
  ChevronsUpDown,
  ExternalLink,
  Eye,
  EyeOff,
  Filter,
  Globe,
  Grid3X3,
  List,
  Loader2,
  MoreHorizontal,
  Plus,
  Search,
  Star,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { PrefetchLink } from "@/components/prefetch-link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { routes } from "@/lib/constants/routes";
import {
  useBulkDeleteSaves,
  useDeleteSave,
  useGetSaveCount,
  useListSaves,
  useListTags,
  useToggleArchive,
  useToggleFavorite,
} from "@/lib/convex";
import {
  cacheKey,
  clearPaginatedCache,
  getPaginatedCache,
  setPaginatedCache,
  useCachedQuery,
} from "@/lib/hooks/use-cached-query";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { usePrefetchTargets } from "@/lib/hooks/use-prefetch";
import type { SaveVisibility } from "@/lib/types";
import { cn, formatDate, getDomainFromUrl } from "@/lib/utils";

type ViewMode = "grid" | "list";

// Individual filter options (can be combined)
type FilterOption = "favorites" | "archived" | "public" | "private";

const FILTER_OPTIONS: { value: FilterOption; label: string; icon: typeof Star }[] = [
  { value: "favorites", label: "Favorites", icon: Star },
  { value: "archived", label: "Archived", icon: Archive },
  { value: "public", label: "Public", icon: Eye },
  { value: "private", label: "Private", icon: EyeOff },
];

interface SaveItem {
  id: string;
  url: string;
  title: string | null;
  description: string | null;
  imageUrl: string | null;
  visibility: "public" | "private";
  isFavorite: boolean;
  isArchived: boolean;
  savedAt: string | number;
  siteName: string | null;
  tags?: Array<{ id: string; name: string }>;
}

// Memoized list item component - use saveId-based callbacks to maintain stable references
const SaveListItem = memo(function SaveListItem({
  save,
  isSelected,
  isSelectionMode,
  onSelect,
  onToggleFavorite,
  onToggleArchive,
  onDelete,
  onPrefetch,
}: {
  save: SaveItem;
  isSelected: boolean;
  isSelectionMode: boolean;
  onSelect: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onToggleArchive: (id: string) => void;
  onDelete: (save: SaveItem) => void;
  onPrefetch?: (id: string) => void;
}) {
  const visibilityConfig = {
    public: { icon: Eye, label: "Public", class: "tag-mint" },
    private: { icon: EyeOff, label: "Private", class: "tag-denim" },
  };

  const vis = visibilityConfig[save.visibility];
  const VisIcon = vis.icon;

  // Create stable handlers that call parent callbacks with save.id
  const handleSelect = useCallback(() => onSelect(save.id), [onSelect, save.id]);
  const handleToggleFavorite = useCallback(() => onToggleFavorite(save.id), [onToggleFavorite, save.id]);
  const handleToggleArchive = useCallback(() => onToggleArchive(save.id), [onToggleArchive, save.id]);
  const handleDelete = useCallback(() => onDelete(save), [onDelete, save]);
  const handlePrefetch = useCallback(() => onPrefetch?.(save.id), [onPrefetch, save.id]);

  return (
    <div
      className={cn(
        "group relative flex gap-4 rounded-xl border bg-card/50 p-4 transition-all duration-200",
        "hover:bg-card hover:shadow-denim",
        // Add content-visibility for rendering performance on long lists
        "content-visibility-auto contain-intrinsic-size-[auto_100px]",
        isSelected && "border-primary/50 bg-primary/5 shadow-denim"
      )}
    >
      {/* Thumbnail with checkbox overlay */}
      <div className="relative shrink-0">
        {/* Checkbox overlay on thumbnail */}
        <div
          className={cn(
            "absolute left-2 top-2 z-10 transition-all duration-200",
            isSelectionMode
              ? "opacity-100 scale-100"
              : "opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100"
          )}
        >
          <Checkbox
            checked={isSelected}
            onCheckedChange={handleSelect}
            onClick={(e) => e.stopPropagation()}
            className="bg-background/90 backdrop-blur-sm shadow-sm"
          />
        </div>

        <a
          href={save.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="group/thumb block overflow-hidden rounded-lg"
        >
          {save.imageUrl ? (
            <div className="relative h-20 w-32 overflow-hidden rounded-lg bg-muted">
              <Image src={save.imageUrl} alt="" fill className="object-cover" />
              <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover/thumb:bg-black/20">
                <ExternalLink className="h-5 w-5 text-white opacity-0 drop-shadow-lg transition-opacity group-hover/thumb:opacity-100" />
              </div>
            </div>
          ) : (
            <div className="flex h-20 w-32 items-center justify-center rounded-lg bg-linear-to-br from-muted to-muted/50 transition-colors group-hover/thumb:bg-muted">
              <Bookmark className="h-8 w-8 text-muted-foreground/40" />
            </div>
          )}
        </a>
      </div>

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
        <div>
          <div className="flex items-center gap-2">
            <Badge className={cn("shrink-0 gap-1 text-xs", vis.class)}>
              <VisIcon className="h-3 w-3" />
              {vis.label}
            </Badge>
            <PrefetchLink
              href={`/app/saves/${save.id}`}
              onPrefetch={handlePrefetch}
              className="font-medium leading-snug text-foreground transition-colors hover:text-primary line-clamp-1"
            >
              {save.title || save.url}
            </PrefetchLink>
          </div>

          {save.description && (
            <p className="mt-1 text-sm text-muted-foreground line-clamp-1">{save.description}</p>
          )}
        </div>

        {/* Meta row */}
        <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Globe className="h-3 w-3" />
            {getDomainFromUrl(save.url)}
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3 w-3" />
            {formatDate(typeof save.savedAt === "number" ? new Date(save.savedAt) : save.savedAt)}
          </span>
          {save.tags && save.tags.length > 0 && (
            <div className="flex items-center gap-1.5">
              {save.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag.id}
                  className="rounded-full bg-secondary/80 px-2 py-0.5 text-secondary-foreground"
                >
                  {tag.name}
                </span>
              ))}
              {save.tags.length > 2 && (
                <span className="text-muted-foreground">+{save.tags.length - 2}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.preventDefault();
            handleToggleFavorite();
          }}
          className={cn(
            "h-8 w-8 rounded-lg",
            save.isFavorite && "bg-amber/10 text-amber opacity-100"
          )}
        >
          <Star className={cn("h-4 w-4", save.isFavorite && "fill-current")} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.preventDefault();
            handleToggleArchive();
          }}
          className={cn(
            "h-8 w-8 rounded-lg",
            save.isArchived && "bg-denim/10 text-denim opacity-100"
          )}
        >
          <Archive className="h-4 w-4" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem asChild>
              <Link href={`/app/saves/${save.id}`} className="gap-2">
                <Eye className="h-4 w-4" />
                View details
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a href={save.url} target="_blank" rel="noopener noreferrer" className="gap-2">
                <ExternalLink className="h-4 w-4" />
                Open original
              </a>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 text-destructive focus:text-destructive"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
});

// Memoized grid card component
const SaveGridCard = memo(function SaveGridCard({
  save,
  isSelected,
  isSelectionMode,
  onSelect,
  onToggleFavorite,
  onPrefetch,
}: {
  save: SaveItem;
  isSelected: boolean;
  isSelectionMode: boolean;
  onSelect: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onPrefetch?: (id: string) => void;
}) {
  const visibilityConfig = {
    public: { icon: Eye, label: "Public", class: "tag-mint" },
    private: { icon: EyeOff, label: "Private", class: "tag-denim" },
  };

  const vis = visibilityConfig[save.visibility];
  const VisIcon = vis.icon;

  // Create stable handlers
  const handleSelect = useCallback(() => onSelect(save.id), [onSelect, save.id]);
  const handleToggleFavorite = useCallback(() => onToggleFavorite(save.id), [onToggleFavorite, save.id]);
  const handlePrefetch = useCallback(() => onPrefetch?.(save.id), [onPrefetch, save.id]);

  return (
    <Card
      className={cn(
        "group overflow-hidden transition-all duration-200 card-hover relative",
        // Add content-visibility for rendering performance on long lists
        "content-visibility-auto contain-intrinsic-size-[auto_280px]",
        isSelected && "ring-2 ring-primary shadow-denim-lg"
      )}
    >
      {/* Checkbox overlay */}
      <div
        className={cn(
          "absolute left-3 top-3 z-10 transition-all duration-200",
          isSelectionMode
            ? "opacity-100 scale-100"
            : "opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100"
        )}
      >
        <Checkbox
          checked={isSelected}
          onCheckedChange={handleSelect}
          onClick={(e) => e.stopPropagation()}
          className="bg-background/90 backdrop-blur-sm shadow-sm"
        />
      </div>

      {/* Favorite button overlay */}
      <Button
        variant="ghost"
        size="icon"
        onClick={(e) => {
          e.preventDefault();
          handleToggleFavorite();
        }}
        className={cn(
          "absolute right-3 top-3 z-10 h-8 w-8 rounded-full bg-background/90 backdrop-blur-sm shadow-sm transition-all duration-200",
          save.isFavorite ? "opacity-100 text-amber" : "opacity-0 group-hover:opacity-100"
        )}
      >
        <Star className={cn("h-4 w-4", save.isFavorite && "fill-current")} />
      </Button>

      <a
        href={save.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="group/thumb block"
      >
        {save.imageUrl ? (
          <div className="relative aspect-video w-full overflow-hidden bg-muted">
            <Image
              src={save.imageUrl}
              alt=""
              fill
              className="object-cover transition-transform duration-300 group-hover/thumb:scale-105"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover/thumb:bg-black/20">
              <ExternalLink className="h-8 w-8 text-white opacity-0 drop-shadow-lg transition-opacity group-hover/thumb:opacity-100" />
            </div>
          </div>
        ) : (
          <div className="flex aspect-video w-full items-center justify-center bg-linear-to-br from-muted to-muted/50 transition-colors group-hover/thumb:bg-muted/70">
            <Bookmark className="h-10 w-10 text-muted-foreground/30" />
          </div>
        )}
      </a>

      <div className="p-4">
        <PrefetchLink
          href={`/app/saves/${save.id}`}
          onPrefetch={handlePrefetch}
          className="block font-medium leading-snug text-foreground transition-colors hover:text-primary line-clamp-2"
        >
          {save.title || save.url}
        </PrefetchLink>

        {save.description && (
          <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2">{save.description}</p>
        )}

        <div className="mt-3 flex items-center justify-between">
          <span className="flex items-center text-xs text-muted-foreground">
            <Globe className="h-3 w-3 mr-1.5" />
            {getDomainFromUrl(save.url)}
          </span>
          <Badge className={cn("gap-1 text-xs", vis.class)}>
            <VisIcon className="h-3 w-3" />
            {vis.label}
          </Badge>
        </div>
      </div>
    </Card>
  );
});

function SavesSkeleton({ viewMode }: { viewMode: ViewMode }) {
  if (viewMode === "list") {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 rounded-xl border bg-card/50 p-4">
            <Skeleton className="h-20 w-32 rounded-lg" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <div className="flex gap-4">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <Skeleton className="aspect-video w-full" />
          <div className="p-4 space-y-3">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </Card>
      ))}
    </div>
  );
}

export default function SavesPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<Set<FilterOption>>(new Set());
  const [filterComboboxOpen, setFilterComboboxOpen] = useState(false);
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [tagComboboxOpen, setTagComboboxOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [singleDeleteTarget, setSingleDeleteTarget] = useState<SaveItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Pagination state - items restored from cache for instant display, but always fetch fresh
  const [cursor, setCursor] = useState<number | undefined>(undefined);
  const [allItems, setAllItems] = useState<SaveItem[]>(() => {
    const cached = getPaginatedCache<SaveItem>("saves:paginated");
    return cached?.items ?? [];
  });
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Prefetch hook for warming up save detail data on hover
  const prefetch = usePrefetchTargets();

  // Debounce search to avoid firing on every keystroke (300ms delay)
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Debounce filters so user can select multiple without triggering query on each click
  const filtersArray = Array.from(activeFilters).sort().join(",");
  const debouncedFiltersArray = useDebounce(filtersArray, 300);
  const debouncedFilters = new Set(
    debouncedFiltersArray ? (debouncedFiltersArray.split(",") as FilterOption[]) : []
  );

  // Build query options from debounced filters
  const queryOptions = {
    query: debouncedSearch || undefined,
    isArchived: debouncedFilters.has("archived") ? true : undefined,
    isFavorite: debouncedFilters.has("favorites") ? true : undefined,
    visibility: debouncedFilters.has("public")
      ? ("public" as SaveVisibility)
      : debouncedFilters.has("private")
        ? ("private" as SaveVisibility)
        : undefined,
    tagId: (tagFilter as any) || undefined,
    cursor,
    limit: 6,
  };

  // Reset pagination when filters change
  const filterKey = `${debouncedSearch}|${debouncedFiltersArray}|${tagFilter}`;
  const prevFilterKey = useRef(filterKey);
  useEffect(() => {
    if (prevFilterKey.current !== filterKey) {
      setCursor(undefined);
      setAllItems([]);
      clearPaginatedCache("saves:paginated");
      prevFilterKey.current = filterKey;
    }
  }, [filterKey]);

  // Toggle a filter option
  const toggleFilter = (option: FilterOption) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(option)) {
        next.delete(option);
      } else {
        // If selecting public, remove private (and vice versa) - they're mutually exclusive
        if (option === "public") next.delete("private");
        if (option === "private") next.delete("public");
        next.add(option);
      }
      return next;
    });
  };

  // Get filter button label
  const getFilterLabel = () => {
    if (activeFilters.size === 0) return "All saves";
    if (activeFilters.size === 1) {
      const filter = Array.from(activeFilters)[0];
      return FILTER_OPTIONS.find((f) => f.value === filter)?.label || "Filtered";
    }
    return `${activeFilters.size} filters`;
  };

  // Convex queries with stale-while-revalidate caching
  const rawData = useListSaves(queryOptions);
  const rawTags = useListTags();
  const totalCount = useGetSaveCount();

  // Cache to eliminate loading flash on back-navigation
  const data = useCachedQuery(cacheKey("saves:list", queryOptions), rawData);
  const allTags = useCachedQuery("saves:tags", rawTags);

  // Only show loading if no cached data available (first page only)
  const isLoading = data === undefined && cursor === undefined;
  const isTagsLoading = allTags === undefined;

  // Accumulate items when data arrives
  const lastProcessedData = useRef<typeof data | undefined>(undefined);
  useEffect(() => {
    if (!data || data === lastProcessedData.current) return;
    lastProcessedData.current = data;

    setAllItems((prev) => {
      if (cursor === undefined) {
        // First page fetch
        if (prev.length > 0) {
          // We have cached items - check if fresh data matches the first page
          const freshIds = new Set((data.items as SaveItem[]).map((s) => s.id));
          const firstPageOfCache = prev.slice(0, data.items.length);
          const cacheIsValid = firstPageOfCache.every((s) => freshIds.has(s.id));

          if (cacheIsValid) {
            // Cache is still valid - keep all accumulated items, don't update cache
            return prev;
          }
          // Data changed - replace with fresh page 1
          const newItems = data.items as SaveItem[];
          setPaginatedCache("saves:paginated", newItems, data.nextCursor);
          return newItems;
        }
        // No cache - just use fresh data
        const newItems = data.items as SaveItem[];
        setPaginatedCache("saves:paginated", newItems, data.nextCursor);
        return newItems;
      }

      // Load more - append avoiding duplicates
      const existingIds = new Set(prev.map((s) => s.id));
      const additions = (data.items as SaveItem[]).filter((s) => !existingIds.has(s.id));
      const newItems = [...prev, ...additions];
      setPaginatedCache("saves:paginated", newItems, data.nextCursor);
      return newItems;
    });
    setIsLoadingMore(false);
  }, [data, cursor]);

  // Display items (accumulated or current data)
  const displayItems = allItems.length > 0 ? allItems : ((data?.items as SaveItem[]) ?? []);

  // Check hasMore from fresh data, or from cache if we're using cached items
  const cachedData = getPaginatedCache<SaveItem>("saves:paginated");
  const hasMore =
    allItems.length > (data?.items?.length ?? 0)
      ? !!cachedData?.cursor // Using cached items, use cached cursor
      : !!data?.nextCursor; // Using fresh data

  const handleLoadMore = () => {
    // Use cached cursor if we have more items than fresh data (restored from cache)
    const nextCursor =
      allItems.length > (data?.items?.length ?? 0)
        ? (cachedData?.cursor as number | undefined)
        : data?.nextCursor;

    if (nextCursor) {
      setIsLoadingMore(true);
      setCursor(nextCursor);
    }
  };

  // Get the selected tag name for display
  const selectedTagName = tagFilter && allTags?.find((t) => t.id === tagFilter)?.name;

  // Convex mutations
  const toggleFavorite = useToggleFavorite();
  const toggleArchive = useToggleArchive();
  const deleteSave = useDeleteSave();
  const bulkDeleteSaves = useBulkDeleteSaves();

  const isSelectionMode = selectedIds.size > 0;
  const allSelected = displayItems.length > 0 && selectedIds.size === displayItems.length;

  const selectAll = () => {
    if (displayItems.length === 0) return;
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(displayItems.map((s) => s.id)));
    }
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    setShowBulkDeleteDialog(true);
  };

  const confirmBulkDelete = async () => {
    setIsBulkDeleting(true);
    try {
      await bulkDeleteSaves({ saveIds: Array.from(selectedIds) as any[] });
      setSelectedIds(new Set());
      setShowBulkDeleteDialog(false);
    } catch (error) {
      console.error("Failed to bulk delete:", error);
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleSingleDelete = useCallback((save: SaveItem) => {
    setSingleDeleteTarget(save);
  }, []);

  const confirmSingleDelete = async () => {
    if (!singleDeleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteSave({ saveId: singleDeleteTarget.id as any });
      setSingleDeleteTarget(null);
    } catch (error) {
      console.error("Failed to delete:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Stable callbacks that accept id parameter - won't change between renders
  const handleToggleFavorite = useCallback(async (saveId: string) => {
    try {
      await toggleFavorite({ saveId: saveId as any });
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
    }
  }, [toggleFavorite]);

  const handleToggleArchive = useCallback(async (saveId: string) => {
    try {
      await toggleArchive({ saveId: saveId as any });
    } catch (error) {
      console.error("Failed to toggle archive:", error);
    }
  }, [toggleArchive]);

  // Stable callback for selection - accepts id
  const handleToggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Stable callback for prefetch - accepts id
  const handlePrefetch = useCallback((saveId: string) => {
    prefetch.save(saveId);
  }, [prefetch]);

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Saves</h1>
          <p className="text-muted-foreground">
            {activeFilters.size > 0 || searchQuery || tagFilter ? (
              `Showing ${displayItems.length} saves`
            ) : totalCount === undefined ? (
              <span className="inline-flex items-center gap-1">
                <Skeleton className="h-4 w-8 inline-block" /> saves
              </span>
            ) : (
              `${totalCount.toLocaleString()} saves`
            )}
          </p>
        </div>
        <Link href={routes.app.savesNew}>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Save
          </Button>
        </Link>
      </div>

      {/* Filters and search */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        {/* Select button - always rendered to avoid CLS */}
        <Button
          variant="outline"
          onClick={selectAll}
          className="gap-2 h-10 shrink-0"
          disabled={displayItems.length === 0}
        >
          <div
            className={cn(
              "flex h-4 w-4 items-center justify-center rounded border-2 transition-colors",
              allSelected
                ? "border-primary bg-primary text-primary-foreground"
                : isSelectionMode
                  ? "border-primary bg-primary/50 text-primary-foreground"
                  : "border-muted-foreground/50"
            )}
          >
            {(allSelected || isSelectionMode) && <Check className="h-3 w-3" strokeWidth={3} />}
          </div>
          Select All
        </Button>

        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search saves..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 pl-10 pr-10"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Filter combobox - multi-select */}
          <Popover open={filterComboboxOpen} onOpenChange={setFilterComboboxOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                aria-expanded={filterComboboxOpen}
                className="w-[160px] h-10 justify-between"
              >
                <Filter className="mr-2 h-4 w-4 shrink-0" />
                <span className="truncate flex-1 text-left">{getFilterLabel()}</span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0" align="start">
              <Command>
                <CommandList>
                  <CommandGroup>
                    {FILTER_OPTIONS.map((option) => {
                      const Icon = option.icon;
                      const isSelected = activeFilters.has(option.value);
                      return (
                        <CommandItem
                          key={option.value}
                          value={option.value}
                          onSelect={() => toggleFilter(option.value)}
                        >
                          <Check
                            className={cn("mr-2 h-4 w-4", isSelected ? "opacity-100" : "opacity-0")}
                          />
                          <Icon className="mr-2 h-4 w-4 text-muted-foreground" />
                          {option.label}
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                  {activeFilters.size > 0 && (
                    <CommandGroup>
                      <CommandItem
                        onSelect={() => setActiveFilters(new Set())}
                        className="justify-center text-center text-muted-foreground"
                      >
                        Clear filters
                      </CommandItem>
                    </CommandGroup>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {/* Tag filter combobox with search */}
          <Popover open={tagComboboxOpen} onOpenChange={setTagComboboxOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                aria-expanded={tagComboboxOpen}
                className="w-[160px] h-10 justify-between"
                disabled={isTagsLoading || !allTags?.length}
              >
                <Tag className="mr-2 h-4 w-4 shrink-0" />
                <span className="truncate flex-1 text-left">
                  {tagFilter ? selectedTagName || "Tag" : "All tags"}
                </span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0" align="start">
              <Command>
                <CommandInput placeholder="Search tags..." />
                <CommandList>
                  <CommandEmpty>No tags found.</CommandEmpty>
                  <CommandGroup>
                    <CommandItem
                      value="all"
                      onSelect={() => {
                        setTagFilter(null);
                        setTagComboboxOpen(false);
                      }}
                    >
                      <Check
                        className={cn("mr-2 h-4 w-4", !tagFilter ? "opacity-100" : "opacity-0")}
                      />
                      All tags
                    </CommandItem>
                    {allTags?.map((tag) => (
                      <CommandItem
                        key={tag.id}
                        value={tag.name}
                        onSelect={() => {
                          setTagFilter(tag.id);
                          setTagComboboxOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            tagFilter === tag.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {tag.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          <div className="flex h-10 items-center rounded-lg border bg-muted/50 px-1.5 gap-1">
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
              className="h-7 w-7 rounded-md"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              className="h-7 w-7 rounded-md"
              onClick={() => setViewMode("grid")}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Bulk actions bar */}
      {isSelectionMode && (
        <div className="mb-6 flex items-center gap-4 rounded-xl border border-primary/30 bg-primary/5 p-4 shadow-sm">
          <button
            type="button"
            onClick={selectAll}
            className="flex items-center gap-3 text-sm font-medium"
          >
            <div
              className={cn(
                "flex h-5 w-5 items-center justify-center rounded border-2 transition-colors",
                allSelected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-muted-foreground/50 hover:border-primary"
              )}
            >
              {allSelected && <Check className="h-3.5 w-3.5 stroke-3" />}
            </div>
            {allSelected ? "Deselect all" : "Select all"}
          </button>

          <span className="text-sm text-muted-foreground">{selectedIds.size} selected</span>

          <div className="flex-1" />

          <Button
            variant="destructive"
            size="sm"
            onClick={handleBulkDelete}
            disabled={isBulkDeleting}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            {isBulkDeleting ? "Deleting..." : `Delete ${selectedIds.size}`}
          </Button>

          <Button variant="ghost" size="sm" onClick={clearSelection} className="gap-2">
            <X className="h-4 w-4" />
            Cancel
          </Button>
        </div>
      )}

      {/* Saves list/grid */}
      {isLoading ? (
        <SavesSkeleton viewMode={viewMode} />
      ) : displayItems.length > 0 ? (
        <>
          {viewMode === "list" ? (
            <div className="space-y-3">
              {displayItems.map((save) => (
                <SaveListItem
                  key={save.id}
                  save={save}
                  isSelected={selectedIds.has(save.id)}
                  isSelectionMode={isSelectionMode}
                  onSelect={handleToggleSelect}
                  onToggleFavorite={handleToggleFavorite}
                  onToggleArchive={handleToggleArchive}
                  onDelete={handleSingleDelete}
                  onPrefetch={handlePrefetch}
                />
              ))}
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {displayItems.map((save) => (
                <SaveGridCard
                  key={save.id}
                  save={save}
                  isSelected={selectedIds.has(save.id)}
                  isSelectionMode={isSelectionMode}
                  onSelect={handleToggleSelect}
                  onToggleFavorite={handleToggleFavorite}
                  onPrefetch={handlePrefetch}
                />
              ))}
            </div>
          )}

          {/* Load more button */}
          {hasMore && (
            <div className="mt-8 flex justify-center">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="gap-2"
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  "Load more"
                )}
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="py-20 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted">
            <Bookmark className="h-10 w-10 text-muted-foreground/50" />
          </div>
          <h3 className="mt-6 text-lg font-medium">No saves found</h3>
          <p className="mt-2 text-muted-foreground">
            {searchQuery || activeFilters.size > 0 || tagFilter
              ? "Try adjusting your search or filters"
              : "Add your first save to get started"}
          </p>
          {!searchQuery && activeFilters.size === 0 && !tagFilter && (
            <Link href={routes.app.savesNew} className="mt-6 inline-block">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Save
              </Button>
            </Link>
          )}
        </div>
      )}

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Delete {selectedIds.size} save{selectedIds.size > 1 ? "s" : ""}?
            </DialogTitle>
            <DialogDescription>
              This will permanently delete {selectedIds.size} save{selectedIds.size > 1 ? "s" : ""}.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmBulkDelete} disabled={isBulkDeleting}>
              {isBulkDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                `Delete ${selectedIds.size}`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Single Delete Confirmation Dialog */}
      <Dialog
        open={!!singleDeleteTarget}
        onOpenChange={(open) => !open && setSingleDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this save?</DialogTitle>
            <DialogDescription>
              This will permanently delete "{singleDeleteTarget?.title || singleDeleteTarget?.url}".
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSingleDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmSingleDelete} disabled={isDeleting}>
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
