import type { Id } from "@convex/_generated/dataModel";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Clock,
  ExternalLink,
  FileText,
  Globe,
  Info,
  Rss,
  User,
} from "lucide-react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { LogoIcon } from "@/components/logo";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { PublicShareButton } from "@/components/public-share-button";
import { ScrollNavigator } from "@/components/scroll-navigator";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VisitTracker } from "@/components/visit-tracker";
import { SPACE_SLUG_HEADER } from "@/lib/constants/headers";
import { MARKETING_URL } from "@/lib/constants/links";
import {
  getPublicSave,
  getPublicSaveSnapshot,
  getSpaceBySlug,
} from "@/lib/server/cached-queries";
import { formatDate, getDomainFromUrl } from "@/lib/utils";
import { PublicSaveTabs } from "./public-save-tabs";

// Local type definitions for snapshot data
interface SnapshotContent {
  title: string;
  byline: string | null;
  content: string;
  textContent: string;
  excerpt: string;
  siteName: string | null;
  length: number;
  language: string | null;
  storageUrl?: string;
}

interface SnapshotData {
  snapshot: {
    status: string;
    blockedReason: string | null;
    fetchedAt: number | null;
    title: string | null;
    byline: string | null;
    excerpt: string | null;
    wordCount: number | null;
    language: string | null;
  } | null;
  content: SnapshotContent | null;
}

async function getSaveData(spaceSlug: string, saveId: string) {
  try {
    // Resolve space using cached query (deduped if called multiple times)
    const space = await getSpaceBySlug(spaceSlug);

    if (!space) {
      return { space: null, save: null, snapshot: null };
    }

    // Get the specific save and snapshot in parallel using cached queries
    const [save, snapshot] = await Promise.all([
      getPublicSave(space.id as Id<"spaces">, saveId as Id<"saves">),
      getPublicSaveSnapshot(space.id as Id<"spaces">, saveId as Id<"saves">, true),
    ]);

    return { space, save, snapshot: snapshot as SnapshotData | null };
  } catch (error) {
    console.error("Error fetching save data:", error);
    return { space: null, save: null, snapshot: null as SnapshotData | null };
  }
}

// Helper to strip markdown for clean preview text
function stripMarkdown(text: string): string {
  return text
    .replace(/[#*_~`>\[\]()!]/g, "") // Remove markdown syntax
    .replace(/\n+/g, " ") // Collapse newlines to spaces
    .trim();
}

// Helper to truncate text
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 3)}...`;
}

/**
 * Generate dynamic metadata for public save pages.
 * Includes OG tags, Twitter cards, and oEmbed discovery for rich link previews.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ saveId: string }>;
}): Promise<Metadata> {
  const { saveId } = await params;
  const headersList = await headers();
  const spaceSlug = headersList.get(SPACE_SLUG_HEADER);

  if (!spaceSlug) {
    return { title: "Not Found" };
  }

  const { space, save } = await getSaveData(spaceSlug, saveId);

  if (!save || !space) {
    return { title: "Not Found" };
  }

  const title = save.title || "Untitled Save";

  // Prioritize user's note over scraped description
  // Notes add personal context that makes shares more meaningful
  const description = save.note
    ? truncateText(stripMarkdown(save.note), 200)
    : save.description || `Saved from ${getDomainFromUrl(save.url)}`;

  // Build canonical URL - determine domain based on custom domain or subdomain
  const isCustomDomain = spaceSlug.startsWith("custom:");
  const domain = isCustomDomain
    ? spaceSlug.replace("custom:", "")
    : `${spaceSlug}.backpocket.my`;
  const canonicalUrl = `https://${domain}/s/${saveId}`;

  // OG image URL (generated dynamically)
  const ogImageUrl = `https://${domain}/api/og/save/${saveId}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: "article",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      siteName: `${space.name}'s Backpocket`,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
    alternates: {
      canonical: canonicalUrl,
      types: {
        // oEmbed discovery for Slack, Discord, and other platforms
        "application/json+oembed": `/api/oembed?url=${encodeURIComponent(canonicalUrl)}`,
      },
    },
    other: {
      // Theme color for Discord embed sidebar
      "theme-color": "#3B82F6",
    },
  };
}

export default async function PublicSavePermalinkPage({
  params,
}: {
  params: Promise<{ saveId: string }>;
}) {
  const { saveId } = await params;
  const headersList = await headers();
  const spaceSlug = headersList.get(SPACE_SLUG_HEADER);

  if (!spaceSlug) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-warm">
        <div className="text-center">
          <LogoIcon size="xl" className="mx-auto opacity-50" />
          <h1 className="mt-4 text-2xl font-semibold">Save not found</h1>
          <p className="mt-2 text-muted-foreground">This save doesn't exist or is private.</p>
          <Link href="/" className="mt-6 inline-block">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to space
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const { space, save, snapshot } = await getSaveData(spaceSlug, saveId);

  if (!save) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-warm">
        <div className="text-center">
          <LogoIcon size="xl" className="mx-auto opacity-50" />
          <h1 className="mt-4 text-2xl font-semibold">Save not found</h1>
          <p className="mt-2 text-muted-foreground">This save doesn't exist or is private.</p>
          <Link href="/" className="mt-6 inline-block">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to space
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const savedAt = new Date(save.savedAt);

  return (
    <div className="min-h-screen bg-gradient-warm">
      {/* Track visit */}
      {space && <VisitTracker spaceId={space.id as any} />}

      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto max-w-3xl px-6 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to {space?.name || "space"}</span>
            </Link>
            <div className="flex items-center gap-2">
              <PublicShareButton title={save?.title || "Shared link"} />
              <Link
                href="/rss.xml"
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Rss className="h-4 w-4" />
              </Link>
              <ThemeSwitcher />
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-3xl px-6 py-12">
        <article className="animate-slide-up">
          {/* Image */}
          {save.imageUrl && (
            <div className="relative mb-8 aspect-video overflow-hidden rounded-xl border">
              <Image src={save.imageUrl} alt="" fill className="object-cover" />
            </div>
          )}

          {/* Title */}
          <h1 className="text-3xl font-semibold tracking-tight">{save.title || save.url}</h1>

          {/* Meta */}
          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <a
              href={save.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:text-foreground transition-colors"
            >
              <Globe className="h-4 w-4" />
              <span>{save.siteName || getDomainFromUrl(save.url)}</span>
              <ExternalLink className="h-3 w-3" />
            </a>
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              <span>Saved {formatDate(savedAt)}</span>
            </span>
          </div>

          {/* Tabbed Content */}
          <div className="mt-8">
            <PublicSaveTabs
              hasNote={!!save.note}
              sourceContent={
                <div className="space-y-6">
                  {/* Tags - clickable to filter */}
                  {save.tags && save.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {save.tags.map((tag) => (
                        <Link key={tag} href={`/?tag=${encodeURIComponent(tag)}`}>
                          <Badge
                            variant="secondary"
                            className="cursor-pointer hover:bg-denim/20 transition-colors"
                          >
                            {tag}
                          </Badge>
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* Description */}
                  {save.description && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          Description
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">{save.description}</p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Reader Mode Content */}
                  {snapshot?.snapshot?.status === "ready" && snapshot.content ? (
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <BookOpen className="h-4 w-4" />
                          Reader Mode
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          {snapshot.content.length > 0 && (
                            <Badge variant="secondary" className="gap-1">
                              <Clock className="h-3 w-3" />
                              {Math.max(
                                1,
                                Math.ceil(
                                  (snapshot.content.textContent?.split(/\s+/).filter(Boolean)
                                    .length || 0) / 200
                                )
                              )}{" "}
                              min read
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        {/* Disclaimer */}
                        <div className="mb-4 pb-4 border-b border-dashed">
                          <p className="flex items-start gap-2 text-xs text-muted-foreground/70">
                            <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                            {snapshot.content.siteName?.toLowerCase() === "twitter" ||
                            snapshot.content.siteName?.toLowerCase() === "x" ? (
                              <span>
                                This simplified view was extracted using{" "}
                                <a
                                  href="https://developer.twitter.com/en/docs/twitter-for-websites/oembed-api"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="underline underline-offset-2 hover:text-muted-foreground transition-colors"
                                >
                                  Twitter&apos;s oEmbed API
                                </a>
                                . Text may be truncated; media and replies are not included.
                              </span>
                            ) : (
                              <span>
                                This simplified view was extracted using{" "}
                                <a
                                  href="https://github.com/mozilla/readability"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="underline underline-offset-2 hover:text-muted-foreground transition-colors"
                                >
                                  Mozilla Readability
                                </a>
                                , the same technology behind Firefox Reader View. For the complete
                                experience,{" "}
                                <a
                                  href={save.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="underline underline-offset-2 hover:text-muted-foreground transition-colors"
                                >
                                  visit the original
                                </a>
                                .
                              </span>
                            )}
                          </p>
                        </div>

                        {/* Byline */}
                        {snapshot.content.byline && (
                          <div className="flex items-start gap-2 text-sm text-muted-foreground mb-4">
                            <User className="h-4 w-4 shrink-0 mt-0.5" />
                            {snapshot.content.byline.startsWith("<a") ? (
                              <span
                                className="[&_a]:text-primary [&_a]:underline-offset-2 hover:[&_a]:underline"
                                // biome-ignore lint/security/noDangerouslySetInnerHtml: Byline HTML is sanitized on server
                                dangerouslySetInnerHTML={{ __html: snapshot.content.byline }}
                              />
                            ) : (
                              <span>{snapshot.content.byline}</span>
                            )}
                          </div>
                        )}

                        {/* Article content */}
                        <article
                          className="prose prose-neutral dark:prose-invert max-w-none
                            prose-headings:font-semibold prose-headings:tracking-tight
                            prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                            prose-img:rounded-lg prose-img:border
                            prose-blockquote:border-l-primary prose-blockquote:bg-muted/50 prose-blockquote:py-1
                            prose-pre:bg-muted prose-pre:border
                            prose-code:before:content-none prose-code:after:content-none
                            prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded"
                          // biome-ignore lint/security/noDangerouslySetInnerHtml: Content is sanitized on the server
                          dangerouslySetInnerHTML={{ __html: snapshot.content.content }}
                        />

                        {/* Twitter truncation notice */}
                        {(snapshot.content.siteName?.toLowerCase() === "twitter" ||
                          snapshot.content.siteName?.toLowerCase() === "x") &&
                          snapshot.content.length > 0 && (
                            <p className="mt-4 text-sm text-muted-foreground/60 italic">
                              [text may be truncated]
                            </p>
                          )}

                        {/* Original link at the end */}
                        <div className="mt-8 pt-6 border-t text-center">
                          <a
                            href={save.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Globe className="h-4 w-4" />
                            View original at {getDomainFromUrl(save.url)}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    /* CTA when no snapshot content */
                    <div className="rounded-xl border bg-card p-8 text-center">
                      <p className="text-muted-foreground">Want to read the full article?</p>
                      <a
                        href={save.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 inline-block"
                      >
                        <Button>
                          Visit Original
                          <ExternalLink className="ml-2 h-4 w-4" />
                        </Button>
                      </a>
                    </div>
                  )}
                </div>
              }
              noteContent={
                save.note ? (
                  <Card>
                    <CardContent className="pt-6">
                      <MarkdownRenderer content={save.note} />
                    </CardContent>
                  </Card>
                ) : (
                  <div className="rounded-xl border bg-card p-8 text-center">
                    <FileText className="h-8 w-8 mx-auto text-muted-foreground/50" />
                    <p className="mt-4 text-muted-foreground">No note for this save.</p>
                  </div>
                )
              }
            />
          </div>
        </article>
      </main>

      {/* Footer */}
      <footer className="border-t border-denim/15 py-8">
        <div className="mx-auto max-w-3xl px-6">
          <a
            href={MARKETING_URL}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-rust transition-colors"
          >
            <LogoIcon size="xs" />
            <span>Powered by backpocket</span>
          </a>
        </div>
      </footer>

      {/* Scroll navigation with progress and section markers */}
      <ScrollNavigator contentSelector="article" />
    </div>
  );
}
