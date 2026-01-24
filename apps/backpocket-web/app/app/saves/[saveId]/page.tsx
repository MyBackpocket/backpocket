"use client";

import type { SnapshotBlockedReason, SnapshotContent, SnapshotStatus } from "@backpocket/types";
import {
  Archive,
  ArrowLeft,
  BookOpen,
  Calendar,
  Check,
  ChevronDown,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  Folder,
  Globe,
  Hand,
  ImageIcon,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Star,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useCallback, useEffect, useMemo, useRef, useState } from "react";

// Dynamic import for heavy TipTap editor (~100KB+ gzipped)
const NoteEditor = dynamic(
  () => import("@/components/note-editor").then((m) => m.NoteEditor),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-lg border bg-background shadow-sm p-4 min-h-[200px] flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          Loading editor...
        </div>
      </div>
    ),
  }
);
import { ReaderMode } from "@/components/reader-mode";
import { ScrollNavigator } from "@/components/scroll-navigator";
import { Badge } from "@/components/ui/badge";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { routes } from "@/lib/constants/routes";
import {
  useCreateCollection,
  useDeleteSave,
  useGetSave,
  useGetSaveSnapshot,
  useListCollections,
  useRequestSaveSnapshot,
  useToggleArchive,
  useToggleFavorite,
  useUpdateSave,
} from "@/lib/convex";
import { cn, formatDate, getDomainFromUrl } from "@/lib/utils";

// ============================================================================
// Inline Editable Components
// ============================================================================

interface EditableTextProps {
  value: string;
  placeholder?: string;
  onSave: (value: string) => void;
  isSaving?: boolean;
  className?: string;
  inputClassName?: string;
  as?: "h1" | "p" | "span";
}

function EditableText({
  value,
  placeholder = "Click to edit...",
  onSave,
  isSaving,
  className,
  inputClassName,
  as: Component = "span",
}: EditableTextProps) {
  const [isEditing, setIsEditing] = useState(false);
  // Only track local edit value when actively editing
  const [editValue, setEditValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      // Initialize edit value from prop when starting to edit
      setEditValue(value);
      textareaRef.current.focus();
      textareaRef.current.select();
      // Auto-resize to fit content
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [isEditing, value]);

  const handleSave = useCallback(() => {
    const trimmed = editValue.trim();
    if (trimmed !== value) {
      onSave(trimmed);
    }
    setIsEditing(false);
  }, [editValue, value, onSave]);

  const handleCancel = useCallback(() => {
    setEditValue(value);
    setIsEditing(false);
  }, [value]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Save on Enter (without shift for new line)
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSave();
      } else if (e.key === "Escape") {
        e.preventDefault();
        handleCancel();
      }
    },
    [handleSave, handleCancel]
  );

  if (isEditing) {
    return (
      <div className="flex items-start gap-2">
        <textarea
          ref={textareaRef}
          value={editValue}
          onChange={(e) => {
            setEditValue(e.target.value);
            // Auto-resize on input
            e.target.style.height = "auto";
            e.target.style.height = `${e.target.scrollHeight}px`;
          }}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className={cn(
            "flex-1 bg-transparent border-b-2 border-primary outline-none resize-none overflow-hidden",
            inputClassName
          )}
          disabled={isSaving}
          rows={1}
        />
        {isSaving && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground mt-1" />}
      </div>
    );
  }

  return (
    <Component
      onClick={() => setIsEditing(true)}
      className={cn(
        "group/editable cursor-pointer inline-flex items-center gap-2 rounded-md transition-colors",
        "hover:bg-muted/50 -mx-2 px-2 py-0.5",
        !value && "text-muted-foreground italic",
        className
      )}
    >
      {value || placeholder}
      <Pencil className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover/editable:opacity-100 transition-opacity shrink-0" />
    </Component>
  );
}

interface EditableTextareaProps {
  value: string;
  placeholder?: string;
  onSave: (value: string) => void;
  isSaving?: boolean;
  className?: string;
}

function EditableTextarea({
  value,
  placeholder = "Click to add a description...",
  onSave,
  isSaving,
  className,
}: EditableTextareaProps) {
  const [isEditing, setIsEditing] = useState(false);
  // Only track local edit value when actively editing
  const [editValue, setEditValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      // Initialize edit value from prop when starting to edit
      setEditValue(value);
      textareaRef.current.focus();
      textareaRef.current.select();
      // Auto-resize
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [isEditing, value]);

  const handleSave = useCallback(() => {
    const trimmed = editValue.trim();
    if (trimmed !== value) {
      onSave(trimmed);
    }
    setIsEditing(false);
  }, [editValue, value, onSave]);

  const handleCancel = useCallback(() => {
    setEditValue(value);
    setIsEditing(false);
  }, [value]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleCancel();
      } else if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleSave();
      }
    },
    [handleSave, handleCancel]
  );

  if (isEditing) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            Description
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <textarea
            ref={textareaRef}
            value={editValue}
            onChange={(e) => {
              setEditValue(e.target.value);
              // Auto-resize
              e.target.style.height = "auto";
              e.target.style.height = `${e.target.scrollHeight}px`;
            }}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className={cn(
              "w-full bg-transparent border rounded-md border-primary px-3 py-2 outline-none resize-none min-h-[80px]",
              className
            )}
            disabled={isSaving}
            placeholder={placeholder}
          />
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {isSaving ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <span>⌘+Enter to save · Esc to cancel</span>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      onClick={() => setIsEditing(true)}
      className="group/editable cursor-pointer transition-colors hover:bg-muted/30 relative"
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          Description
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className={cn("text-muted-foreground", !value && "italic")}>{value || placeholder}</p>
      </CardContent>
      <Pencil className="absolute top-4 right-4 h-4 w-4 text-muted-foreground opacity-0 group-hover/editable:opacity-100 transition-opacity" />
    </Card>
  );
}
interface InlineTagsEditorProps {
  tags: string[];
  onSave: (tags: string[]) => void;
  isSaving?: boolean;
}

function InlineTagsEditor({ tags, onSave, isSaving }: InlineTagsEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  // Only track local state when actively editing
  const [editTags, setEditTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      // Initialize from prop when starting to edit
      setEditTags(tags);
      inputRef.current?.focus();
    }
  }, [isEditing, tags]);

  const handleAddTag = useCallback(() => {
    const trimmed = tagInput.trim().toLowerCase();
    if (trimmed && !editTags.includes(trimmed)) {
      setEditTags((prev) => [...prev, trimmed]);
    }
    setTagInput("");
  }, [tagInput, editTags]);

  const handleRemoveTag = useCallback((tagToRemove: string) => {
    setEditTags((prev) => prev.filter((t) => t !== tagToRemove));
  }, []);

  const handleSave = useCallback(() => {
    // Include any pending tag input
    const finalTags = tagInput.trim() ? [...editTags, tagInput.trim().toLowerCase()] : editTags;
    const uniqueTags = [...new Set(finalTags)];

    if (JSON.stringify(uniqueTags) !== JSON.stringify(tags)) {
      onSave(uniqueTags);
    }
    setTagInput("");
    setIsEditing(false);
  }, [editTags, tagInput, tags, onSave]);

  const handleCancel = useCallback(() => {
    setEditTags(tags);
    setTagInput("");
    setIsEditing(false);
  }, [tags]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Tab" || e.key === "Enter") {
        if (tagInput.trim()) {
          e.preventDefault();
          handleAddTag();
        } else if (e.key === "Enter") {
          e.preventDefault();
          handleSave();
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        handleCancel();
      } else if (e.key === "Backspace" && !tagInput && editTags.length > 0) {
        setEditTags((prev) => prev.slice(0, -1));
      }
    },
    [tagInput, editTags.length, handleAddTag, handleSave, handleCancel]
  );

  if (isEditing) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Tag className="h-4 w-4 text-muted-foreground" />
            Tags
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-primary bg-background px-3 py-2 min-h-[42px]">
            {editTags.map((tag) => (
              <Badge key={tag} variant="secondary" className="gap-1 pr-1 text-xs">
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            <input
              ref={inputRef}
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={editTags.length === 0 ? "Type a tag..." : ""}
              className="flex-1 min-w-[80px] bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              disabled={isSaving}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              ) : (
                <Check className="h-3 w-3 mr-1" />
              )}
              Done
            </Button>
            <span className="text-xs text-muted-foreground">Tab to add · Enter to save</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      onClick={() => setIsEditing(true)}
      className="group/editable cursor-pointer transition-colors hover:bg-muted/30 relative"
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Tag className="h-4 w-4 text-muted-foreground" />
          Tags
        </CardTitle>
      </CardHeader>
      <CardContent>
        {tags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
        ) : (
          <span className="text-sm text-muted-foreground italic">No tags</span>
        )}
      </CardContent>
      <Pencil className="absolute top-4 right-4 h-4 w-4 text-muted-foreground opacity-0 group-hover/editable:opacity-100 transition-opacity" />
    </Card>
  );
}

interface InlineCollectionsEditorProps {
  selectedIds: string[];
  allCollections: Array<{ id: string; name: string }>;
  onSave: (collectionIds: string[]) => void;
  onCreateCollection: (name: string) => void;
  isSaving?: boolean;
  isCreating?: boolean;
}

function InlineCollectionsEditor({
  selectedIds,
  allCollections,
  onSave,
  onCreateCollection,
  isSaving,
  isCreating,
}: InlineCollectionsEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  // Only track local state when actively editing
  const [editIds, setEditIds] = useState<string[]>([]);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newName, setNewName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      // Initialize from prop when starting to edit
      setEditIds(selectedIds);
    }
  }, [isEditing, selectedIds]);

  useEffect(() => {
    if (isCreatingNew && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isCreatingNew]);

  const handleToggle = useCallback((id: string) => {
    setEditIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  }, []);

  const handleSave = useCallback(() => {
    if (JSON.stringify(editIds.sort()) !== JSON.stringify(selectedIds.sort())) {
      onSave(editIds);
    }
    setIsEditing(false);
  }, [editIds, selectedIds, onSave]);

  const handleCancel = useCallback(() => {
    setEditIds(selectedIds);
    setIsEditing(false);
    setIsCreatingNew(false);
    setNewName("");
  }, [selectedIds]);

  const handleCreateNew = useCallback(() => {
    const trimmed = newName.trim();
    if (trimmed) {
      onCreateCollection(trimmed);
      setNewName("");
      setIsCreatingNew(false);
    }
  }, [newName, onCreateCollection]);

  const handleNewKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleCreateNew();
      } else if (e.key === "Escape") {
        e.preventDefault();
        setIsCreatingNew(false);
        setNewName("");
      }
    },
    [handleCreateNew]
  );

  const selectedCollections = allCollections.filter((c) => selectedIds.includes(c.id));

  if (isEditing) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Folder className="h-4 w-4 text-muted-foreground" />
            Collections
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            {allCollections.map((col) => {
              const isSelected = editIds.includes(col.id);
              return (
                <Badge
                  key={col.id}
                  variant={isSelected ? "default" : "outline"}
                  className={cn(
                    "cursor-pointer transition-colors",
                    isSelected ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                  )}
                  onClick={() => handleToggle(col.id)}
                >
                  {col.name}
                </Badge>
              );
            })}
            {isCreatingNew ? (
              <div className="flex items-center gap-1.5 rounded-md border border-input bg-background px-2 py-1">
                <input
                  ref={inputRef}
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={handleNewKeyDown}
                  onBlur={() => {
                    if (!newName.trim()) {
                      setIsCreatingNew(false);
                    }
                  }}
                  placeholder="Name..."
                  className="w-24 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  disabled={isCreating}
                />
                {isCreating ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreatingNew(false);
                      setNewName("");
                    }}
                    className="rounded p-0.5 hover:bg-muted transition-colors"
                  >
                    <X className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                )}
              </div>
            ) : (
              <Badge
                variant="outline"
                className="cursor-pointer gap-1 border-dashed hover:bg-muted transition-colors"
                onClick={() => setIsCreatingNew(true)}
              >
                <Plus className="h-3 w-3" />
                New
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              ) : (
                <Check className="h-3 w-3 mr-1" />
              )}
              Done
            </Button>
            <Button size="sm" variant="ghost" onClick={handleCancel}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      onClick={() => setIsEditing(true)}
      className="group/editable cursor-pointer transition-colors hover:bg-muted/30 relative"
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Folder className="h-4 w-4 text-muted-foreground" />
          Collections
        </CardTitle>
      </CardHeader>
      <CardContent>
        {selectedCollections.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {selectedCollections.map((col) => (
              <Badge key={col.id} variant="secondary">
                {col.name}
              </Badge>
            ))}
          </div>
        ) : (
          <span className="text-sm text-muted-foreground italic">No collections</span>
        )}
      </CardContent>
      <Pencil className="absolute top-4 right-4 h-4 w-4 text-muted-foreground opacity-0 group-hover/editable:opacity-100 transition-opacity" />
    </Card>
  );
}

// ============================================================================
// Mobile Edit Tip Component
// ============================================================================

const MOBILE_TIP_STORAGE_KEY = "backpocket-mobile-edit-tip-dismissed";

function MobileEditTip() {
  const [isDismissed, setIsDismissed] = useState(true); // Start hidden to avoid flash
  const [isMobile, setIsMobile] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Use matchMedia for reliable mobile detection (works with viewport changes)
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(e.matches);
    };
    // Check initial value
    handleChange(mediaQuery);
    // Listen for changes
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    // Check localStorage after mount
    const dismissed = localStorage.getItem(MOBILE_TIP_STORAGE_KEY);
    const shouldShow = dismissed !== "true";
    setIsDismissed(!shouldShow);
    // Delay showing for smooth animation
    if (shouldShow) {
      const timer = setTimeout(() => setIsVisible(true), 100);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = useCallback(() => {
    setIsVisible(false);
    // Delay actual dismissal for exit animation
    setTimeout(() => {
      setIsDismissed(true);
      localStorage.setItem(MOBILE_TIP_STORAGE_KEY, "true");
    }, 200);
  }, []);

  // Only show on mobile and if not dismissed
  if (!isMobile || isDismissed) return null;

  return (
    <div
      className={cn(
        "fixed top-4 left-4 right-4 z-50 flex items-center gap-3 rounded-lg bg-background/95 backdrop-blur-sm border shadow-lg px-4 py-3 text-sm transition-all duration-200",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
      )}
    >
      <Hand className="h-5 w-5 text-primary shrink-0" />
      <p className="flex-1 text-muted-foreground">
        <span className="font-medium text-foreground">Tip:</span> Tap any card to edit it
      </p>
      <button
        type="button"
        onClick={handleDismiss}
        className="rounded-full p-1.5 hover:bg-muted transition-colors"
        aria-label="Dismiss tip"
      >
        <X className="h-4 w-4 text-muted-foreground" />
      </button>
    </div>
  );
}

export default function SaveDetailPage({ params }: { params: Promise<{ saveId: string }> }) {
  const { saveId } = use(params);
  const router = useRouter();

  // Convex queries
  const save = useGetSave(saveId as any);
  const allCollections = useListCollections({});
  const snapshotData = useGetSaveSnapshot(saveId as any, true);

  // Convex mutations
  const updateSave = useUpdateSave();
  const toggleFavorite = useToggleFavorite();
  const toggleArchive = useToggleArchive();
  const deleteSaveMutation = useDeleteSave();
  const createCollection = useCreateCollection();
  const requestSnapshot = useRequestSaveSnapshot();

  // Loading and mutation states
  const isLoading = save === undefined;
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);
  const [isRefreshingContent, setIsRefreshingContent] = useState(false);
  const [isRefreshingMetadata, setIsRefreshingMetadata] = useState(false);

  // Dialog states
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Inline update handlers
  const handleUpdateTitle = useCallback(
    async (title: string) => {
      setIsSaving(true);
      try {
        await updateSave({ id: saveId as any, title: title || undefined });
      } catch (error) {
        console.error("Failed to update title:", error);
      } finally {
        setIsSaving(false);
      }
    },
    [saveId, updateSave]
  );

  const handleUpdateDescription = useCallback(
    async (description: string) => {
      setIsSaving(true);
      try {
        await updateSave({ id: saveId as any, description: description || undefined });
      } catch (error) {
        console.error("Failed to update description:", error);
      } finally {
        setIsSaving(false);
      }
    },
    [saveId, updateSave]
  );

  const handleUpdateNote = useCallback(
    async (note: string) => {
      setIsSaving(true);
      try {
        await updateSave({ id: saveId as any, note: note || undefined });
      } catch (error) {
        console.error("Failed to update note:", error);
      } finally {
        setIsSaving(false);
      }
    },
    [saveId, updateSave]
  );

  const handleUpdateVisibility = useCallback(
    async (newVisibility: "private" | "public") => {
      setIsSaving(true);
      try {
        await updateSave({ id: saveId as any, visibility: newVisibility });
      } catch (error) {
        console.error("Failed to update visibility:", error);
      } finally {
        setIsSaving(false);
      }
    },
    [saveId, updateSave]
  );

  const handleUpdateTags = useCallback(
    async (tags: string[]) => {
      setIsSaving(true);
      try {
        await updateSave({ id: saveId as any, tagNames: tags });
      } catch (error) {
        console.error("Failed to update tags:", error);
      } finally {
        setIsSaving(false);
      }
    },
    [saveId, updateSave]
  );

  const handleUpdateCollections = useCallback(
    async (collectionIds: string[]) => {
      setIsSaving(true);
      try {
        await updateSave({ id: saveId as any, collectionIds: collectionIds as any[] });
      } catch (error) {
        console.error("Failed to update collections:", error);
      } finally {
        setIsSaving(false);
      }
    },
    [saveId, updateSave]
  );

  const handleCreateCollection = useCallback(
    async (name: string) => {
      setIsCreatingCollection(true);
      try {
        await createCollection({ name });
      } catch (error) {
        console.error("Failed to create collection:", error);
      } finally {
        setIsCreatingCollection(false);
      }
    },
    [createCollection]
  );

  const handleConfirmDelete = useCallback(async () => {
    setIsDeleting(true);
    try {
      await deleteSaveMutation({ saveId: saveId as any });
      router.push(routes.app.saves);
    } catch (error) {
      console.error("Failed to delete:", error);
    } finally {
      setIsDeleting(false);
    }
  }, [saveId, deleteSaveMutation, router]);

  const handleToggleFavorite = useCallback(async () => {
    try {
      await toggleFavorite({ saveId: saveId as any });
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
    }
  }, [saveId, toggleFavorite]);

  const handleToggleArchive = useCallback(async () => {
    try {
      await toggleArchive({ saveId: saveId as any });
    } catch (error) {
      console.error("Failed to toggle archive:", error);
    }
  }, [saveId, toggleArchive]);

  const handleRefreshContent = useCallback(async () => {
    setIsRefreshingContent(true);
    try {
      await requestSnapshot({ saveId: saveId as any, force: true });
    } catch (error) {
      console.error("Failed to request snapshot:", error);
    } finally {
      setIsRefreshingContent(false);
    }
  }, [saveId, requestSnapshot]);

  const handleRefreshMetadata = useCallback(async () => {
    if (!save) return;
    setIsRefreshingMetadata(true);
    try {
      // Fetch fresh metadata from the URL
      const response = await fetch("/api/unfurl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: save.url }),
      });

      if (response.ok) {
        const data = await response.json();
        // Update save with fresh metadata (only update fields that have new values)
        const updates: {
          id: any;
          title?: string;
          description?: string;
          imageUrl?: string;
          siteName?: string;
        } = {
          id: saveId as any,
        };
        if (data.title) updates.title = data.title;
        if (data.description) updates.description = data.description;
        if (data.imageUrl) updates.imageUrl = data.imageUrl;
        if (data.siteName) updates.siteName = data.siteName;
        await updateSave(updates);
      }
    } catch (error) {
      console.error("Failed to refresh metadata:", error);
    } finally {
      setIsRefreshingMetadata(false);
    }
  }, [save, saveId, updateSave]);

  const handleRefreshAll = useCallback(async () => {
    await Promise.all([handleRefreshMetadata(), handleRefreshContent()]);
  }, [handleRefreshMetadata, handleRefreshContent]);

  // Memoize derived arrays to prevent breaking child component memoization
  const tagNames = useMemo(() => save?.tags?.map((t) => t.name) ?? [], [save?.tags]);
  const selectedCollectionIds = useMemo(
    () => save?.collections?.map((c) => c.id) ?? [],
    [save?.collections]
  );

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="mx-auto max-w-3xl">
          <Skeleton className="h-6 w-24 mb-6" />
          <Skeleton className="aspect-video w-full rounded-xl mb-6" />
          <Skeleton className="h-8 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/4 mb-6" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (!save) {
    return (
      <div className="p-6 lg:p-8">
        <div className="mx-auto max-w-3xl text-center py-16">
          <h2 className="text-xl font-semibold">Save not found</h2>
          <p className="mt-2 text-muted-foreground">
            This save may have been deleted or doesn't exist.
          </p>
          <Link href={routes.app.saves} className="mt-6 inline-block">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to saves
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mx-auto max-w-3xl">
        {/* Back link */}
        <div className="mb-6">
          <Link
            href={routes.app.saves}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            Back to saves
          </Link>
        </div>

        {/* Mobile edit tip - only shows on first visit on mobile */}
        <MobileEditTip />

        {/* Image - links to source */}
        {save.imageUrl && (
          <a
            href={save.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group/image relative mb-6 block aspect-video overflow-hidden rounded-xl border transition-all hover:shadow-lg"
          >
            <Image src={save.imageUrl} alt="" fill className="object-cover" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover/image:bg-black/10">
              <ExternalLink className="h-8 w-8 text-white opacity-0 drop-shadow-lg transition-opacity group-hover/image:opacity-100" />
            </div>
          </a>
        )}

        {/* Title - Inline Editable */}
        <EditableText
          value={save.title || ""}
          placeholder={save.url}
          onSave={handleUpdateTitle}
          isSaving={isSaving}
          className="text-2xl font-semibold tracking-tight mb-2"
          inputClassName="text-2xl font-semibold tracking-tight"
          as="h1"
        />

        {/* Meta row: source, date, and visibility */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground mb-4">
          <a
            href={save.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-foreground transition-colors"
          >
            <Globe className="h-4 w-4" />
            {getDomainFromUrl(save.url)}
            <ExternalLink className="h-3 w-3" />
          </a>
          <span className="hidden sm:inline">•</span>
          <span className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {formatDate(new Date(save.savedAt))}
          </span>
          <span className="hidden sm:inline">•</span>
          {/* Visibility Toggle */}
          <button
            type="button"
            onClick={() =>
              handleUpdateVisibility(save.visibility === "public" ? "private" : "public")
            }
            disabled={isSaving}
            className={cn(
              "relative inline-flex h-7 items-center rounded-full border px-1 transition-all",
              "hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              save.visibility === "public"
                ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950"
                : "border-muted bg-muted/50"
            )}
          >
            {/* Private indicator */}
            <span
              className={cn(
                "flex h-5 w-5 items-center justify-center rounded-full transition-all duration-200",
                save.visibility === "private" ? "bg-background shadow-sm" : "bg-transparent"
              )}
            >
              <EyeOff
                className={cn(
                  "h-3 w-3 transition-colors",
                  save.visibility === "private" ? "text-foreground" : "text-muted-foreground/50"
                )}
              />
            </span>
            {/* Public indicator */}
            <span
              className={cn(
                "flex h-5 w-5 items-center justify-center rounded-full transition-all duration-200",
                save.visibility === "public" ? "bg-green-500 shadow-sm" : "bg-transparent"
              )}
            >
              <Eye
                className={cn(
                  "h-3 w-3 transition-colors",
                  save.visibility === "public" ? "text-white" : "text-muted-foreground/50"
                )}
              />
            </span>
            {/* Label */}
            <span
              className={cn(
                "ml-1 mr-1.5 text-xs font-medium transition-colors",
                save.visibility === "public"
                  ? "text-green-700 dark:text-green-400"
                  : "text-muted-foreground"
              )}
            >
              {save.visibility === "public" ? "Public" : "Private"}
            </span>
            {isSaving && (
              <Loader2 className="absolute -right-5 h-3 w-3 animate-spin text-muted-foreground" />
            )}
          </button>
        </div>

        {/* Action toolbar */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleFavorite}
            className={cn("gap-2", save.isFavorite && "text-yellow-500")}
          >
            <Star className={cn("h-4 w-4", save.isFavorite && "fill-current")} />
            <span className="hidden sm:inline">{save.isFavorite ? "Unfavorite" : "Favorite"}</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleArchive}
            className={cn("gap-2", save.isArchived && "text-primary")}
          >
            <Archive className="h-4 w-4" />
            <span className="hidden sm:inline">{save.isArchived ? "Unarchive" : "Archive"}</span>
          </Button>

          {/* Refresh dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                disabled={isRefreshingMetadata || isRefreshingContent}
              >
                {isRefreshingMetadata || isRefreshingContent ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">Refresh</span>
                <ChevronDown className="h-3 w-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={handleRefreshMetadata} disabled={isRefreshingMetadata}>
                <ImageIcon className="h-4 w-4 mr-2" />
                Refresh metadata
                <span className="ml-auto text-xs text-muted-foreground">title, image</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleRefreshContent} disabled={isRefreshingContent}>
                <BookOpen className="h-4 w-4 mr-2" />
                Refresh content
                <span className="ml-auto text-xs text-muted-foreground">reader mode</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleRefreshAll}
                disabled={isRefreshingMetadata || isRefreshingContent}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh all
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            size="sm"
            className="gap-2 text-destructive hover:text-destructive"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="h-4 w-4" />
            <span className="hidden sm:inline">Delete</span>
          </Button>
        </div>

        {/* Tabbed Content */}
        <Tabs defaultValue="source" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="source" className="gap-2">
              <BookOpen className="h-4 w-4" />
              Source
            </TabsTrigger>
            <TabsTrigger value="note" className="gap-2">
              <FileText className="h-4 w-4" />
              Note
            </TabsTrigger>
          </TabsList>

          {/* Source Tab - Article content and metadata */}
          <TabsContent value="source" className="space-y-6">
            {/* Description */}
            <EditableTextarea
              value={save.description || ""}
              placeholder="Click to add a description..."
              onSave={handleUpdateDescription}
              isSaving={isSaving}
            />

            {/* Tags and Collections */}
            <div className="grid gap-6 md:grid-cols-2">
              <InlineTagsEditor
                tags={tagNames}
                onSave={handleUpdateTags}
                isSaving={isSaving}
              />
              <InlineCollectionsEditor
                selectedIds={selectedCollectionIds}
                allCollections={allCollections || []}
                onSave={handleUpdateCollections}
                onCreateCollection={handleCreateCollection}
                isSaving={isSaving}
                isCreating={isCreatingCollection}
              />
            </div>

            {/* Reader Mode */}
            <ReaderMode
              status={(snapshotData?.snapshot?.status as SnapshotStatus) ?? null}
              blockedReason={snapshotData?.snapshot?.blockedReason as SnapshotBlockedReason | null}
              content={snapshotData?.content as SnapshotContent | null}
              isLoading={snapshotData === undefined}
              onRefresh={handleRefreshContent}
              isRefreshing={isRefreshingContent}
              showRefreshButton={false}
              originalUrl={save.url}
            />
          </TabsContent>

          {/* Note Tab - Personal notes/microblog */}
          <TabsContent value="note">
            <NoteEditor
              value={save.note || ""}
              onChange={(value) => handleUpdateNote(value)}
              placeholder="Add your thoughts, annotations, or commentary..."
              autoSave
              autoSaveDelay={1000}
            />
          </TabsContent>
        </Tabs>

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete this save?</DialogTitle>
              <DialogDescription>
                This will permanently delete "{save.title || save.url}". This action cannot be
                undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleConfirmDelete} disabled={isDeleting}>
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

        {/* Scroll navigation with progress and section markers */}
        <ScrollNavigator contentSelector="article" />
      </div>
    </div>
  );
}
