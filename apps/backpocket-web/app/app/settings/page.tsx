"use client";

import {
  AlertCircle,
  ArrowUpRight,
  Check,
  Eye,
  EyeOff,
  Link as LinkIcon,
  Loader2,
  Lock,
  Monitor,
  Moon,
  Sun,
  User,
} from "lucide-react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { useCallback, useEffect, useRef, useState } from "react";
import { AccountInfo } from "@/components/auth-components";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ROOT_DOMAIN } from "@/lib/config/public";
import { buildSpaceUrl, isLocalhostHostname } from "@/lib/constants/urls";
import {
  useCheckSlugAvailability,
  useGetMySpace,
  useUpdateSettings,
  useUpdateSlug,
} from "@/lib/convex";
import type { PublicLayout, SaveVisibility, SpaceVisibility } from "@/lib/types";

type SaveStatus = "idle" | "saving" | "saved";

export default function SettingsPage() {
  const space = useGetMySpace();
  const isLoading = space === undefined;

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [visibility, setVisibility] = useState<SpaceVisibility>("private");
  const [publicLayout, setPublicLayout] = useState<PublicLayout>("grid");
  const [defaultSaveVisibility, setDefaultSaveVisibility] = useState<SaveVisibility>("private");

  // Auto-save status
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const initialLoadDone = useRef(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Slug editing state
  const [slug, setSlug] = useState("");
  const [slugInput, setSlugInput] = useState("");
  const [isEditingSlug, setIsEditingSlug] = useState(false);
  const [slugError, setSlugError] = useState<string | null>(null);
  const [isUpdatingSlug, setIsUpdatingSlug] = useState(false);

  const updateSettings = useUpdateSettings();
  const updateSlugMutation = useUpdateSlug();

  // Check slug availability
  const slugAvailability = useCheckSlugAvailability(
    isEditingSlug && slugInput.length >= 3 && slugInput !== slug ? slugInput : undefined
  );
  const isCheckingSlug = slugAvailability === undefined && isEditingSlug && slugInput.length >= 3 && slugInput !== slug;

  // Initialize state from space data
  useEffect(() => {
    if (space) {
      setName(space.name || "");
      setBio(space.bio || "");
      setVisibility(space.visibility as SpaceVisibility);
      setPublicLayout(space.publicLayout as PublicLayout);
      setDefaultSaveVisibility(space.defaultSaveVisibility as SaveVisibility);
      setSlug(space.slug);
      setSlugInput(space.slug);
      // Mark initial load as complete after a short delay to avoid triggering auto-save
      setTimeout(() => {
        initialLoadDone.current = true;
      }, 100);
    }
  }, [space]);

  // Auto-save helper function
  const saveSettings = useCallback(
    async (settings: {
      name?: string;
      bio?: string;
      visibility?: SpaceVisibility;
      publicLayout?: PublicLayout;
      defaultSaveVisibility?: SaveVisibility;
    }) => {
      setSaveStatus("saving");
      try {
        await updateSettings(settings);
        setSaveStatus("saved");
        // Reset to idle after showing "Saved" briefly
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(() => setSaveStatus("idle"), 2000);
      } catch (error) {
        console.error("Failed to save settings:", error);
        setSaveStatus("idle");
      }
    },
    [updateSettings]
  );

  // Debounced auto-save for text inputs (name, bio)
  useEffect(() => {
    if (!initialLoadDone.current || !space) return;
    if (name === (space.name || "")) return;

    const timeout = setTimeout(() => {
      saveSettings({ name });
    }, 500);

    return () => clearTimeout(timeout);
  }, [name, space, saveSettings]);

  useEffect(() => {
    if (!initialLoadDone.current || !space) return;
    if (bio === (space.bio || "")) return;

    const timeout = setTimeout(() => {
      saveSettings({ bio });
    }, 500);

    return () => clearTimeout(timeout);
  }, [bio, space, saveSettings]);

  // Immediate save handlers for toggles and selects
  const handleVisibilityChange = useCallback(
    (checked: boolean) => {
      const newVisibility = checked ? "public" : "private";
      setVisibility(newVisibility);
      if (initialLoadDone.current) {
        saveSettings({ visibility: newVisibility });
      }
    },
    [saveSettings]
  );

  const handleLayoutChange = useCallback(
    (value: string) => {
      const newLayout = value as PublicLayout;
      setPublicLayout(newLayout);
      if (initialLoadDone.current) {
        saveSettings({ publicLayout: newLayout });
      }
    },
    [saveSettings]
  );

  const handleDefaultSaveVisibilityChange = useCallback(
    (value: string) => {
      const newVisibility = value as SaveVisibility;
      setDefaultSaveVisibility(newVisibility);
      if (initialLoadDone.current) {
        saveSettings({ defaultSaveVisibility: newVisibility });
      }
    },
    [saveSettings]
  );

  const handleSlugChange = useCallback((value: string) => {
    // Normalize: lowercase, remove invalid chars
    const normalized = value.toLowerCase().replace(/[^a-z0-9-]/g, "");
    setSlugInput(normalized);
    setSlugError(null);
  }, []);

  const handleSlugSave = async () => {
    if (slugInput === slug) {
      setIsEditingSlug(false);
      return;
    }
    setIsUpdatingSlug(true);
    try {
      await updateSlugMutation({ slug: slugInput });
      setSlug(slugInput);
      setIsEditingSlug(false);
      setSlugError(null);
    } catch (error: any) {
      setSlugError(error?.message || "Failed to update slug");
    } finally {
      setIsUpdatingSlug(false);
    }
  };

  const handleSlugCancel = () => {
    setSlugInput(slug);
    setIsEditingSlug(false);
    setSlugError(null);
  };

  // Get slug status message
  const getSlugStatus = () => {
    if (slugInput === slug) {
      return null;
    }
    if (slugInput.length < 3) {
      return { type: "error", message: "At least 3 characters required" };
    }
    if (isCheckingSlug) {
      return { type: "loading", message: "Checking availability..." };
    }
    if (slugAvailability) {
      if (slugAvailability.available) {
        return { type: "success", message: "Available!" };
      }
      switch (slugAvailability.reason) {
        case "reserved":
          return { type: "error", message: "This subdomain is reserved" };
        case "taken":
          return { type: "error", message: "Already taken" };
        case "invalid_format":
          return { type: "error", message: "Invalid format" };
        default:
          return { type: "error", message: "Not available" };
      }
    }
    return null;
  };

  const slugStatus = getSlugStatus();

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="mx-auto max-w-2xl">
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-4 w-48 mb-8" />
          <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-40" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
            {saveStatus === "saving" && (
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Saving...
              </span>
            )}
            {saveStatus === "saved" && (
              <span className="flex items-center gap-1 text-sm text-green-600 animate-in fade-in duration-200">
                <Check className="h-3.5 w-3.5" />
                Saved
              </span>
            )}
          </div>
          <p className="text-muted-foreground">Manage your space and public profile</p>
        </div>

        <div className="space-y-6">
          {/* Profile Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Space</CardTitle>
              <CardDescription>This information appears on your public space</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="block pb-2">
                  Display Name
                </Label>
                <Input
                  id="name"
                  placeholder="Your name or title"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio" className="block pb-2">
                  Bio
                </Label>
                <Textarea
                  id="bio"
                  placeholder="A short description of your collection"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Displayed on your public space header
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Account Settings */}
          <AccountCard />

          {/* Subdomain Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LinkIcon className="h-5 w-5" />
                Subdomain
              </CardTitle>
              <CardDescription>Your public space URL on {ROOT_DOMAIN}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditingSlug ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="slug">Subdomain</Label>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Input
                          id="slug"
                          value={slugInput}
                          onChange={(e) => handleSlugChange(e.target.value)}
                          placeholder="your-name"
                          className="pr-10"
                        />
                        {slugStatus && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            {slugStatus.type === "loading" && (
                              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            )}
                            {slugStatus.type === "success" && (
                              <Check className="h-4 w-4 text-green-600" />
                            )}
                            {slugStatus.type === "error" && (
                              <AlertCircle className="h-4 w-4 text-destructive" />
                            )}
                          </div>
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground whitespace-nowrap">
                        .{ROOT_DOMAIN}
                      </span>
                    </div>
                    {slugStatus && (
                      <p
                        className={`text-xs ${
                          slugStatus.type === "success"
                            ? "text-green-600"
                            : slugStatus.type === "error"
                              ? "text-destructive"
                              : "text-muted-foreground"
                        }`}
                      >
                        {slugStatus.message}
                      </p>
                    )}
                    {slugError && <p className="text-xs text-destructive">{slugError}</p>}
                    <p className="text-xs text-muted-foreground">
                      3-32 characters, lowercase letters, numbers, and hyphens only
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleSlugSave}
                      disabled={
                        isUpdatingSlug ||
                        slugInput === slug ||
                        slugStatus?.type === "error" ||
                        slugStatus?.type === "loading"
                      }
                    >
                      {isUpdatingSlug && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleSlugCancel}>
                      Cancel
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      {slug}.{ROOT_DOMAIN}
                    </p>
                    <p className="text-xs text-muted-foreground">This is your public space URL</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setIsEditingSlug(true)}>
                    Change
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Space Visibility */}
          <Card>
            <CardHeader>
              <CardTitle>Public Space</CardTitle>
              <CardDescription>Control whether your space is visible to the public</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Space Visibility</Label>
                  <p className="text-sm text-muted-foreground">
                    {visibility === "public"
                      ? `Your space is visible at ${slug}.${ROOT_DOMAIN}`
                      : "Your space is private and not accessible publicly"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {visibility === "public" ? (
                    <Eye className="h-5 w-5 text-green-600" />
                  ) : (
                    <EyeOff className="h-5 w-5 text-muted-foreground" />
                  )}
                  <Switch
                    checked={visibility === "public"}
                    onCheckedChange={handleVisibilityChange}
                  />
                </div>
              </div>

              {visibility === "public" && (
                <>
                  <Separator />

                  <div className="space-y-2">
                    <Label htmlFor="layout" className="block pb-2">
                      Default Layout
                    </Label>
                    <Select
                      value={publicLayout}
                      onValueChange={handleLayoutChange}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="grid">Grid — Card-based visual layout</SelectItem>
                        <SelectItem value="list">List — Compact text-based layout</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      How saves are displayed on your public space
                    </p>
                  </div>

                  <div className="rounded-lg border bg-muted/50 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Preview your space</p>
                        <p className="text-xs text-muted-foreground">
                          {slug}.{ROOT_DOMAIN}
                        </p>
                      </div>
                      <a
                        href={buildSpaceUrl({
                          slug,
                          rootDomain: ROOT_DOMAIN,
                          isLocalhost:
                            typeof window !== "undefined" &&
                            isLocalhostHostname(window.location.hostname),
                        })}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button variant="outline" size="sm">
                          Visit
                          <ArrowUpRight className="ml-1 h-3 w-3" />
                        </Button>
                      </a>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Default Save Visibility */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Default Save Visibility
              </CardTitle>
              <CardDescription>Choose the default visibility for new saves</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="defaultVisibility" className="block pb-2">
                  When you save a new link
                </Label>
                <Select
                  value={defaultSaveVisibility}
                  onValueChange={handleDefaultSaveVisibilityChange}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="private">
                      <div className="flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        Private — Only you can see
                      </div>
                    </SelectItem>
                    <SelectItem value="public">
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        Public — Visible on your public space and RSS feed
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  You can always change visibility for individual saves
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Theme Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>
                Choose your preferred theme. This setting applies across the entire platform.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ThemeSelector />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Floating save indicator - visible when scrolled */}
      {saveStatus !== "idle" && (
        <div className="fixed bottom-6 right-6 z-50">
          <div
            className={`flex items-center gap-2 rounded-full px-4 py-2 shadow-lg transition-all duration-200 ${
              saveStatus === "saving"
                ? "bg-muted text-muted-foreground"
                : "bg-green-600 text-white"
            }`}
          >
            {saveStatus === "saving" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm font-medium">Saving...</span>
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                <span className="text-sm font-medium">Saved</span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Account card component with Clerk integration
function AccountCard() {
  return (
    <AccountInfo
      fallback={
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Account
            </CardTitle>
            <CardDescription>Manage your account settings</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Account management is not available in development mode.
            </p>
          </CardContent>
        </Card>
      }
    >
      {({ user, isLoaded, openUserProfile }) => {
        if (!isLoaded) {
          return (
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Skeleton className="h-14 w-14 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        }

        if (!user) {
          return (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Account
                </CardTitle>
                <CardDescription>Manage your account settings</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Account management is not available.
                </p>
              </CardContent>
            </Card>
          );
        }

        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Account
              </CardTitle>
              <CardDescription>Manage your account, profile picture, and security</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {user.imageUrl ? (
                    <Image
                      src={user.imageUrl}
                      alt={user.fullName || "Profile"}
                      width={56}
                      height={56}
                      className="h-14 w-14 rounded-full object-cover ring-2 ring-border"
                    />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground text-lg font-semibold ring-2 ring-border">
                      {user.firstName?.charAt(0)?.toUpperCase() ||
                        user.emailAddresses?.[0]?.emailAddress?.charAt(0)?.toUpperCase() ||
                        "U"}
                    </div>
                  )}
                  <div>
                    <p className="font-medium">
                      {user.fullName || user.emailAddresses?.[0]?.emailAddress || "User"}
                    </p>
                    {user.fullName && user.emailAddresses?.[0]?.emailAddress && (
                      <p className="text-sm text-muted-foreground">
                        {user.emailAddresses[0].emailAddress}
                      </p>
                    )}
                  </div>
                </div>
                <Button variant="outline" onClick={() => openUserProfile()}>
                  Manage Account
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      }}
    </AccountInfo>
  );
}

// Theme selector component
function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
    );
  }

  const themes = [
    { value: "light", label: "Light", icon: Sun, description: "Light background" },
    { value: "dark", label: "Dark", icon: Moon, description: "Dark background" },
    { value: "system", label: "System", icon: Monitor, description: "Match device" },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {themes.map(({ value, label, icon: Icon, description }) => (
        <button
          key={value}
          type="button"
          onClick={() => setTheme(value)}
          className={`relative flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all hover:bg-accent ${
            theme === value
              ? "border-denim bg-denim/5"
              : "border-transparent bg-muted/50 hover:border-muted-foreground/20"
          }`}
        >
          <Icon className={`h-6 w-6 ${theme === value ? "text-denim" : "text-muted-foreground"}`} />
          <div className="text-center">
            <p className={`text-sm font-medium ${theme === value ? "text-foreground" : ""}`}>
              {label}
            </p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
          {theme === value && (
            <div className="absolute top-2 right-2">
              <Check className="h-4 w-4 text-denim" />
            </div>
          )}
        </button>
      ))}
    </div>
  );
}
