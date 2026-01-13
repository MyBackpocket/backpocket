"use node";

/**
 * Domain-specific content extractors for sites that don't work well with Readability
 * (Twitter, Reddit, Instagram, etc.)
 */

import { getDateFromSnowflakeId, isTwitterUrl, parseTwitterUrl } from "@backpocket/utils";
import { parseHTML } from "linkedom";

// ============================================================================
// Types
// ============================================================================

export interface ExtractedContent {
  title: string;
  byline: string | null;
  content: string;
  textContent: string;
  excerpt: string;
  siteName: string;
  language: string | null;
}

// ============================================================================
// Constants
// ============================================================================

const EXCERPT_LENGTH = 250;

// ============================================================================
// Reddit Extractor
// ============================================================================

// Reddit URL patterns
const REDDIT_DOMAINS = [
  "reddit.com",
  "www.reddit.com",
  "old.reddit.com",
  "new.reddit.com",
  "np.reddit.com",
  "m.reddit.com",
  "i.reddit.com",
];

// Short URL pattern (redd.it)
const REDDIT_SHORT_PATTERN = /^https?:\/\/redd\.it\/(\w+)/i;

// Post URL pattern: /r/subreddit/comments/postId/title_slug/
const REDDIT_POST_PATTERN =
  /^https?:\/\/(?:(?:www|old|new|np|m|i)\.)?reddit\.com\/r\/(\w+)\/comments\/(\w+)(?:\/([^/?#]+))?/i;

// Comment URL pattern: /r/subreddit/comments/postId/title_slug/commentId/
const REDDIT_COMMENT_PATTERN =
  /^https?:\/\/(?:(?:www|old|new|np|m|i)\.)?reddit\.com\/r\/(\w+)\/comments\/(\w+)\/([^/?]+)\/(\w+)/i;

// Subreddit URL pattern: /r/subreddit/
const REDDIT_SUBREDDIT_PATTERN =
  /^https?:\/\/(?:(?:www|old|new|np|m|i)\.)?reddit\.com\/r\/(\w+)\/?(?:\?.*)?$/i;

// User URL pattern: /u/username/ or /user/username/
const REDDIT_USER_PATTERN =
  /^https?:\/\/(?:(?:www|old|new|np|m|i)\.)?reddit\.com\/u(?:ser)?\/([^/?]+)/i;

// Content indicators for error states
const REDDIT_ERROR_INDICATORS = [
  /this community is private/i,
  /you must be invited/i,
  /page not found/i,
  /this subreddit is quarantined/i,
  /content is not available/i,
];

const DELETED_CONTENT_INDICATORS = ["[deleted]", "[removed]"];

type RedditContentType = "post" | "comment" | "subreddit" | "user";

interface RedditUrlInfo {
  type: RedditContentType;
  subreddit?: string;
  postId?: string;
  titleSlug?: string;
  commentId?: string;
  username?: string;
  originalUrl: string;
}

/**
 * Check if a URL is a Reddit URL
 */
export function isRedditUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();

    // Check redd.it short URLs
    if (hostname === "redd.it") {
      return true;
    }

    // Check main Reddit domains
    return REDDIT_DOMAINS.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`));
  } catch {
    return false;
  }
}

/**
 * Parse a Reddit URL and determine its content type
 */
function parseRedditUrl(url: string): RedditUrlInfo | null {
  // Handle redd.it short URLs
  const shortMatch = url.match(REDDIT_SHORT_PATTERN);
  if (shortMatch) {
    return {
      type: "post",
      postId: shortMatch[1],
      originalUrl: url,
    };
  }

  // Check for comment (must check before post since it's more specific)
  const commentMatch = url.match(REDDIT_COMMENT_PATTERN);
  if (commentMatch) {
    return {
      type: "comment",
      subreddit: commentMatch[1],
      postId: commentMatch[2],
      titleSlug: commentMatch[3],
      commentId: commentMatch[4],
      originalUrl: url,
    };
  }

  // Check for post
  const postMatch = url.match(REDDIT_POST_PATTERN);
  if (postMatch) {
    return {
      type: "post",
      subreddit: postMatch[1],
      postId: postMatch[2],
      titleSlug: postMatch[3],
      originalUrl: url,
    };
  }

  // Check for subreddit
  const subredditMatch = url.match(REDDIT_SUBREDDIT_PATTERN);
  if (subredditMatch) {
    return {
      type: "subreddit",
      subreddit: subredditMatch[1],
      originalUrl: url,
    };
  }

  // Check for user
  const userMatch = url.match(REDDIT_USER_PATTERN);
  if (userMatch) {
    return {
      type: "user",
      username: userMatch[1],
      originalUrl: url,
    };
  }

  return null;
}

/**
 * Convert a Reddit URL to old.reddit.com equivalent for scraping
 */
function toOldRedditUrl(info: RedditUrlInfo): string {
  switch (info.type) {
    case "post":
      if (info.subreddit && info.postId) {
        const slug = info.titleSlug ? `/${info.titleSlug}` : "";
        return `https://old.reddit.com/r/${info.subreddit}/comments/${info.postId}${slug}`;
      }
      // Short URL - need to resolve
      return `https://old.reddit.com/${info.postId}`;

    case "comment":
      return `https://old.reddit.com/r/${info.subreddit}/comments/${info.postId}/${info.titleSlug}/${info.commentId}`;

    case "subreddit":
      return `https://old.reddit.com/r/${info.subreddit}`;

    case "user":
      return `https://old.reddit.com/u/${info.username}`;
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function generateExcerpt(text: string): string {
  let excerpt = text.trim();
  if (excerpt.length > EXCERPT_LENGTH) {
    excerpt = excerpt.slice(0, EXCERPT_LENGTH);
    const lastSpace = excerpt.lastIndexOf(" ");
    if (lastSpace > EXCERPT_LENGTH * 0.8) {
      excerpt = `${excerpt.slice(0, lastSpace)}...`;
    } else {
      excerpt = `${excerpt}...`;
    }
  }
  return excerpt;
}

function formatBylineDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function parseRedditTime(timeElement: Element | null): Date | null {
  if (!timeElement) return null;

  const datetime = timeElement.getAttribute("datetime");
  if (datetime) {
    const date = new Date(datetime);
    if (!Number.isNaN(date.getTime())) {
      return date;
    }
  }

  const title = timeElement.getAttribute("title");
  if (title) {
    const date = new Date(title);
    if (!Number.isNaN(date.getTime())) {
      return date;
    }
  }

  return null;
}

function isErrorPage(document: Document): boolean {
  const pageContent = document.body?.textContent || "";
  return REDDIT_ERROR_INDICATORS.some((pattern) => pattern.test(pageContent));
}

function isDeletedContent(text: string): boolean {
  const trimmed = text.trim();
  return DELETED_CONTENT_INDICATORS.some((indicator) =>
    trimmed.toLowerCase().includes(indicator.toLowerCase())
  );
}

function generatePostTitle(author: string, subreddit: string, title: string): string {
  const prefix = subreddit ? `Post in r/${subreddit.replace(/^r\//, "")}` : `Post by u/${author}`;

  const maxLength = 60;
  if (title.length <= maxLength) {
    return `${prefix}: ${title}`;
  }

  let truncated = title.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(" ");
  if (lastSpace > maxLength * 0.7) {
    truncated = truncated.slice(0, lastSpace);
  }

  return `${prefix}: ${truncated}...`;
}

// ============================================================================
// Reddit Fetch & Extract
// ============================================================================

async function fetchOldReddit(url: string): Promise<Document | null> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; BackpocketBot/1.0; +https://backpocket.app)",
        Accept: "text/html",
        "Accept-Language": "en-US,en;q=0.9",
      },
      redirect: "follow",
    });

    if (!response.ok) {
      return null;
    }

    const html = await response.text();
    const { document } = parseHTML(html);
    return document;
  } catch {
    return null;
  }
}

async function extractRedditPost(info: RedditUrlInfo): Promise<ExtractedContent | null> {
  const url = toOldRedditUrl(info);
  const document = await fetchOldReddit(url);

  if (!document || isErrorPage(document)) {
    return null;
  }

  // Find the post container - old.reddit uses .thing with class link
  const postContainer =
    document.querySelector(".thing.link") || document.querySelector('[data-type="link"]');

  if (!postContainer) {
    return null;
  }

  // Extract title
  const titleElement =
    postContainer.querySelector(".title a.title") || postContainer.querySelector("a.title");
  const title = titleElement?.textContent?.trim() || "Reddit Post";

  // Extract subreddit
  const subredditElement = postContainer.querySelector(".subreddit");
  const subreddit = subredditElement?.textContent?.trim() || info.subreddit || "";

  // Extract author
  const authorElement = postContainer.querySelector(".author");
  const author = authorElement?.textContent?.trim() || "[deleted]";

  // Extract timestamp
  const timeElement = postContainer.querySelector("time");
  const postDate = parseRedditTime(timeElement);

  // Extract score
  const scoreElement =
    postContainer.querySelector(".score.unvoted") || postContainer.querySelector(".score");
  const score = scoreElement?.getAttribute("title") || scoreElement?.textContent?.trim();

  // Extract self-text (for text posts)
  const selfTextElement =
    document.querySelector(".expando .usertext-body .md") ||
    document.querySelector(".selftext .md");
  let selfText = "";
  let selfTextHtml = "";

  if (selfTextElement) {
    selfText = selfTextElement.textContent?.trim() || "";
    selfTextHtml = selfTextElement.innerHTML || "";

    // Check if content was deleted
    if (isDeletedContent(selfText)) {
      selfText = "[This content has been deleted or removed]";
      selfTextHtml = `<p><em>${selfText}</em></p>`;
    }
  }

  // Extract link URL (for link posts)
  const linkElement = postContainer.querySelector("a.title");
  const linkUrl = linkElement?.getAttribute("href");
  const isExternalLink = linkUrl && !linkUrl.includes("reddit.com") && !linkUrl.startsWith("/");

  // Build content HTML
  let contentHtml = "";

  if (isExternalLink) {
    contentHtml += `<p><strong>Link:</strong> <a href="${escapeHtml(linkUrl)}" rel="noopener noreferrer" target="_blank">${escapeHtml(linkUrl)}</a></p>`;
  }

  if (selfTextHtml) {
    contentHtml += selfTextHtml;
  }

  if (!contentHtml) {
    contentHtml = "<p><em>This post contains no text content.</em></p>";
  }

  // Build text content for excerpt
  let textContent = selfText || title;
  if (isExternalLink) {
    textContent = `Link: ${linkUrl}\n\n${selfText || ""}`.trim();
  }

  // Build byline
  const dateStr = postDate ? ` · ${formatBylineDate(postDate)}` : "";
  const scoreStr = score ? ` · ${score} points` : "";
  const bylineHtml = `<a href="https://reddit.com/u/${escapeHtml(author)}" rel="noopener noreferrer" target="_blank">u/${escapeHtml(author)}</a> in <a href="https://reddit.com/r/${escapeHtml(subreddit.replace(/^r\//, ""))}" rel="noopener noreferrer" target="_blank">${escapeHtml(subreddit || info.subreddit || "reddit")}</a>${scoreStr}${dateStr}`;

  // Generate title with content snippet
  const displayTitle = generatePostTitle(author, subreddit || info.subreddit || "", title);

  return {
    title: displayTitle,
    byline: bylineHtml,
    content: contentHtml,
    textContent,
    excerpt: generateExcerpt(textContent),
    siteName: "Reddit",
    language: null,
  };
}

async function extractRedditComment(info: RedditUrlInfo): Promise<ExtractedContent | null> {
  const url = toOldRedditUrl(info);
  const document = await fetchOldReddit(url);

  if (!document || isErrorPage(document)) {
    return null;
  }

  // Find the targeted comment
  const commentId = info.commentId;
  const commentContainer =
    document.querySelector(`#thing_t1_${commentId}`) ||
    document.querySelector(`.comment[data-fullname="t1_${commentId}"]`) ||
    document.querySelector(".comment.target") ||
    document.querySelector(".comment");

  if (!commentContainer) {
    return null;
  }

  // Get parent post title
  const postTitleElement = document.querySelector(".title a.title");
  const postTitle = postTitleElement?.textContent?.trim() || "Reddit Post";

  // Extract comment author
  const authorElement = commentContainer.querySelector(".author");
  const author = authorElement?.textContent?.trim() || "[deleted]";

  // Extract subreddit
  const subredditElement = document.querySelector(".subreddit");
  const subreddit = subredditElement?.textContent?.trim() || info.subreddit || "";

  // Extract comment text
  const commentBodyElement = commentContainer.querySelector(".usertext-body .md");
  let commentText = commentBodyElement?.textContent?.trim() || "";
  let commentHtml = commentBodyElement?.innerHTML || "";

  if (isDeletedContent(commentText)) {
    commentText = "[This comment has been deleted or removed]";
    commentHtml = `<p><em>${commentText}</em></p>`;
  }

  // Extract timestamp
  const timeElement = commentContainer.querySelector("time");
  const commentDate = parseRedditTime(timeElement);

  // Extract score
  const scoreElement = commentContainer.querySelector(".score.unvoted");
  const score = scoreElement?.getAttribute("title") || scoreElement?.textContent?.trim();

  // Build content HTML with context
  let contentHtml = `<p><strong>Comment on:</strong> <a href="https://reddit.com/r/${escapeHtml(subreddit.replace(/^r\//, ""))}/comments/${info.postId}" rel="noopener noreferrer" target="_blank">${escapeHtml(postTitle)}</a></p>`;
  contentHtml += "<hr />";
  contentHtml += commentHtml || "<p><em>No content</em></p>";

  // Build byline
  const dateStr = commentDate ? ` · ${formatBylineDate(commentDate)}` : "";
  const scoreStr = score ? ` · ${score} points` : "";
  const bylineHtml = `<a href="https://reddit.com/u/${escapeHtml(author)}" rel="noopener noreferrer" target="_blank">u/${escapeHtml(author)}</a> in <a href="https://reddit.com/r/${escapeHtml(subreddit.replace(/^r\//, ""))}" rel="noopener noreferrer" target="_blank">${escapeHtml(subreddit)}</a>${scoreStr}${dateStr}`;

  // Generate title
  const displayTitle = `Comment by u/${author}: ${generateExcerpt(commentText).slice(0, 50)}${commentText.length > 50 ? "..." : ""}`;

  return {
    title: displayTitle,
    byline: bylineHtml,
    content: contentHtml,
    textContent: commentText,
    excerpt: generateExcerpt(commentText),
    siteName: "Reddit",
    language: null,
  };
}

async function extractSubredditInfo(info: RedditUrlInfo): Promise<ExtractedContent | null> {
  const url = toOldRedditUrl(info);
  const document = await fetchOldReddit(url);

  if (!document) {
    return null;
  }

  // Check if it's a private subreddit
  if (isErrorPage(document)) {
    const pageContent = document.body?.textContent || "";
    if (/this community is private/i.test(pageContent)) {
      return {
        title: `r/${info.subreddit}`,
        byline: "Private subreddit",
        content: `<p>This subreddit is private. You must be invited to view this community.</p>`,
        textContent: "This subreddit is private.",
        excerpt: "This subreddit is private.",
        siteName: "Reddit",
        language: null,
      };
    }
    return null;
  }

  const subreddit = info.subreddit || "";

  // Extract description from sidebar
  const descriptionElement =
    document.querySelector(".side .md") || document.querySelector(".titlebox .usertext-body .md");
  const description = descriptionElement?.textContent?.trim() || "";
  const descriptionHtml = descriptionElement?.innerHTML || "";

  // Extract subscriber count
  const subscriberElement = document.querySelector(".subscribers .number");
  const subscribers = subscriberElement?.textContent?.trim() || "";

  // Extract active users
  const activeElement = document.querySelector(".users-online .number");
  const activeUsers = activeElement?.textContent?.trim() || "";

  // Extract subreddit title/tagline
  const taglineElement = document.querySelector(".titlebox h1.redditname");
  const tagline = taglineElement?.textContent?.trim() || `r/${subreddit}`;

  // Build content HTML
  let contentHtml = `<h2>${escapeHtml(tagline)}</h2>`;

  if (subscribers || activeUsers) {
    contentHtml += "<p>";
    if (subscribers) {
      contentHtml += `<strong>${escapeHtml(subscribers)}</strong> subscribers`;
    }
    if (subscribers && activeUsers) {
      contentHtml += " · ";
    }
    if (activeUsers) {
      contentHtml += `<strong>${escapeHtml(activeUsers)}</strong> online`;
    }
    contentHtml += "</p>";
  }

  if (descriptionHtml) {
    contentHtml += "<hr />";
    contentHtml += descriptionHtml;
  } else {
    contentHtml += "<p><em>No description available.</em></p>";
  }

  // Build byline
  const statsStr = subscribers ? `${subscribers} subscribers` : "";
  const bylineHtml = statsStr || "Reddit community";

  // Text content for excerpt
  const textContent = description || `r/${subreddit} - Reddit community`;

  return {
    title: `r/${subreddit}`,
    byline: bylineHtml,
    content: contentHtml,
    textContent,
    excerpt: generateExcerpt(textContent),
    siteName: "Reddit",
    language: null,
  };
}

async function extractUserProfile(info: RedditUrlInfo): Promise<ExtractedContent | null> {
  const url = toOldRedditUrl(info);
  const document = await fetchOldReddit(url);

  if (!document || isErrorPage(document)) {
    return null;
  }

  const username = info.username || "";

  // Extract karma from the sidebar
  const karmaElement = document.querySelector(".karma");
  const karma = karmaElement?.textContent?.trim() || "";

  // Extract account age
  const ageElement = document.querySelector(".age time");
  const accountAge = parseRedditTime(ageElement);

  // Extract trophy case or summary info
  const trophyElements = document.querySelectorAll(".trophy-name");
  const trophies: string[] = [];
  for (const el of trophyElements) {
    const trophy = el.textContent?.trim();
    if (trophy) {
      trophies.push(trophy);
    }
  }

  // Get recent post titles for summary
  const postElements = document.querySelectorAll(".thing.link .title a.title");
  const recentPosts: string[] = [];
  let count = 0;
  for (const el of postElements) {
    if (count >= 5) break;
    const postTitle = el.textContent?.trim();
    if (postTitle) {
      recentPosts.push(postTitle);
      count++;
    }
  }

  // Build content HTML
  let contentHtml = `<h2>u/${escapeHtml(username)}</h2>`;

  if (karma) {
    contentHtml += `<p><strong>Karma:</strong> ${escapeHtml(karma)}</p>`;
  }

  if (accountAge) {
    contentHtml += `<p><strong>Account created:</strong> ${formatBylineDate(accountAge)}</p>`;
  }

  if (trophies.length > 0) {
    contentHtml += "<h3>Trophies</h3>";
    contentHtml += `<p>${trophies.map((t) => escapeHtml(t)).join(", ")}</p>`;
  }

  if (recentPosts.length > 0) {
    contentHtml += "<h3>Recent Activity</h3>";
    contentHtml += "<ul>";
    for (const post of recentPosts) {
      contentHtml += `<li>${escapeHtml(post)}</li>`;
    }
    contentHtml += "</ul>";
  }

  // Build byline
  const ageStr = accountAge ? `Redditor since ${formatBylineDate(accountAge)}` : "";
  const karmaStr = karma ? `${karma} karma` : "";
  const bylineParts = [karmaStr, ageStr].filter(Boolean);
  const bylineHtml = bylineParts.join(" · ") || "Reddit user";

  // Text content for excerpt
  const textContent = `u/${username} - ${bylineParts.join(", ") || "Reddit user"}`;

  return {
    title: `u/${username}`,
    byline: bylineHtml,
    content: contentHtml,
    textContent,
    excerpt: generateExcerpt(textContent),
    siteName: "Reddit",
    language: null,
  };
}

async function resolveShortUrl(info: RedditUrlInfo): Promise<RedditUrlInfo | null> {
  const shortUrl = `https://redd.it/${info.postId}`;

  try {
    const response = await fetch(shortUrl, {
      method: "HEAD",
      redirect: "follow",
    });

    if (!response.ok) {
      return null;
    }

    // The final URL after redirects should be the full Reddit URL
    const finalUrl = response.url;
    const parsedInfo = parseRedditUrl(finalUrl);

    if (parsedInfo) {
      return parsedInfo;
    }

    // If we can't parse it, add the info we have
    return {
      ...info,
      originalUrl: finalUrl,
    };
  } catch {
    return null;
  }
}

/**
 * Main extraction function for Reddit - handles all Reddit URL types
 */
export async function extractReddit(url: string): Promise<ExtractedContent | null> {
  const urlInfo = parseRedditUrl(url);

  if (!urlInfo) {
    return null;
  }

  // Resolve short URLs first
  let resolvedInfo = urlInfo;
  if (urlInfo.type === "post" && !urlInfo.subreddit && urlInfo.postId) {
    const resolved = await resolveShortUrl(urlInfo);
    if (resolved) {
      resolvedInfo = resolved;
    }
  }

  // Route to the appropriate extractor
  switch (resolvedInfo.type) {
    case "post":
      return extractRedditPost(resolvedInfo);

    case "comment":
      return extractRedditComment(resolvedInfo);

    case "subreddit":
      return extractSubredditInfo(resolvedInfo);

    case "user":
      return extractUserProfile(resolvedInfo);

    default:
      return null;
  }
}

// ============================================================================
// Twitter/X Extractor
// ============================================================================

// Twitter oEmbed API endpoint
const TWITTER_OEMBED_URL = "https://publish.twitter.com/oembed";

// X Articles use /article/ instead of /status/
const TWITTER_ARTICLE_PATTERN =
  /^https?:\/\/(?:www\.)?(?:twitter\.com|x\.com)\/(\w+)\/article\/(\d+)/i;

// Content that indicates we got an error/login page instead of actual content
const TWITTER_ERROR_PAGE_INDICATORS = [
  /^log\s*in$/i,
  /^sign\s*up$/i,
  /^something went wrong/i,
  /^tweet$/i, // Generic "Tweet" title without username
];

interface TwitterOEmbedResponse {
  url: string;
  author_name: string;
  author_url: string;
  html: string;
  provider_name: string;
  provider_url: string;
}

/**
 * Generate a descriptive title from username and tweet content
 * Format: "Tweet by @username: first ~50 chars..."
 */
function generateTweetTitle(username: string, content: string): string {
  const baseTitle = `Tweet by @${username}`;

  if (!content || content.trim().length === 0) {
    return baseTitle;
  }

  const trimmedContent = content.trim();
  const maxLength = 50;

  if (trimmedContent.length <= maxLength) {
    return `${baseTitle}: ${trimmedContent}`;
  }

  // Truncate at word boundary
  let truncated = trimmedContent.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(" ");

  // If there's a reasonable word boundary (at least 70% of max length), use it
  if (lastSpace > maxLength * 0.7) {
    truncated = truncated.slice(0, lastSpace);
  }

  return `${baseTitle}: ${truncated}...`;
}

/**
 * Check if content appears to be from an error/login page
 */
function isTwitterErrorPageContent(content: string | null | undefined): boolean {
  if (!content) return true;
  const trimmed = content.trim();
  if (trimmed.length === 0) return true;
  return TWITTER_ERROR_PAGE_INDICATORS.some((pattern) => pattern.test(trimmed));
}

/**
 * Check if a URL is an X Article (not a regular tweet)
 */
function isArticleUrl(url: string): boolean {
  return TWITTER_ARTICLE_PATTERN.test(url);
}

/**
 * Extract tweet text from oEmbed HTML response
 * The HTML is a blockquote containing the tweet content
 */
function extractTweetTextFromHtml(html: string): string {
  try {
    const { document } = parseHTML(html);

    // The oEmbed HTML is a blockquote with the tweet content
    const blockquote = document.querySelector("blockquote");
    if (!blockquote) {
      return "";
    }

    // Get all paragraph elements (tweet content)
    const paragraphs = blockquote.querySelectorAll("p");
    const textParts: string[] = [];

    for (const p of paragraphs) {
      const text = p.textContent?.trim();
      if (text) {
        textParts.push(text);
      }
    }

    return textParts.join("\n\n");
  } catch {
    return "";
  }
}

/**
 * Try to extract tweet via Twitter's official oEmbed API
 */
async function tryTwitterOEmbed(url: string): Promise<ExtractedContent | null> {
  try {
    const oembedUrl = new URL(TWITTER_OEMBED_URL);
    oembedUrl.searchParams.set("url", url);
    oembedUrl.searchParams.set("omit_script", "true");

    const response = await fetch(oembedUrl.toString(), {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as TwitterOEmbedResponse;

    // Extract the tweet text from the HTML blockquote
    const tweetText = extractTweetTextFromHtml(data.html);

    if (!tweetText) {
      return null;
    }

    // Build excerpt
    let excerpt = tweetText;
    if (excerpt.length > EXCERPT_LENGTH) {
      excerpt = excerpt.slice(0, EXCERPT_LENGTH);
      const lastSpace = excerpt.lastIndexOf(" ");
      if (lastSpace > EXCERPT_LENGTH * 0.8) {
        excerpt = `${excerpt.slice(0, lastSpace)}...`;
      } else {
        excerpt = `${excerpt}...`;
      }
    }

    // Extract username from author URL (e.g., "https://twitter.com/4nzn" -> "4nzn")
    const usernameMatch = data.author_url.match(/(?:twitter\.com|x\.com)\/(\w+)/i);
    const username = usernameMatch ? usernameMatch[1] : data.author_name;

    // Extract tweet date from Snowflake ID
    const tweetInfo = parseTwitterUrl(url);
    const tweetDate = tweetInfo ? getDateFromSnowflakeId(tweetInfo.tweetId) : null;
    const dateStr = tweetDate ? ` · ${formatBylineDate(tweetDate)}` : "";

    // Build readable HTML content
    const paragraphs = tweetText.split("\n\n").filter((p) => p.trim());

    const content =
      paragraphs.length > 0 ? paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join("\n") : "";

    // Byline with link to author profile and date
    const bylineHtml = `<a href="${data.author_url}" rel="noopener noreferrer" target="_blank">@${username}</a>${dateStr}`;

    return {
      title: generateTweetTitle(username, tweetText),
      byline: bylineHtml,
      content,
      textContent: tweetText,
      excerpt,
      siteName: data.provider_name || "Twitter",
      language: null,
    };
  } catch {
    return null;
  }
}

/**
 * Try to extract tweet via FxTwitter (fallback)
 * FxTwitter provides better OG tags for tweets
 */
async function tryFxTwitter(url: string): Promise<ExtractedContent | null> {
  const tweetInfo = parseTwitterUrl(url);
  if (!tweetInfo) {
    return null;
  }

  try {
    const fxUrl = `https://fxtwitter.com/${tweetInfo.username}/status/${tweetInfo.tweetId}`;

    const response = await fetch(fxUrl, {
      headers: {
        "User-Agent": "bot",
        Accept: "text/html",
      },
    });

    if (!response.ok) {
      return null;
    }

    const html = await response.text();
    const { document } = parseHTML(html);

    // Extract OG metadata
    const ogTitle = document.querySelector('meta[property="og:title"]')?.getAttribute("content");
    const ogDescription = document
      .querySelector('meta[property="og:description"]')
      ?.getAttribute("content");
    const ogSiteName = document
      .querySelector('meta[property="og:site_name"]')
      ?.getAttribute("content");

    // Check if we got error page content instead of actual tweet
    if (
      !ogDescription ||
      isTwitterErrorPageContent(ogDescription) ||
      isTwitterErrorPageContent(ogTitle)
    ) {
      return null;
    }

    // Build excerpt
    let excerpt = ogDescription;
    if (excerpt.length > EXCERPT_LENGTH) {
      excerpt = excerpt.slice(0, EXCERPT_LENGTH);
      const lastSpace = excerpt.lastIndexOf(" ");
      if (lastSpace > EXCERPT_LENGTH * 0.8) {
        excerpt = `${excerpt.slice(0, lastSpace)}...`;
      } else {
        excerpt = `${excerpt}...`;
      }
    }

    // Build readable HTML content
    const paragraphs = ogDescription.split("\n\n").filter((p) => p.trim());

    const content =
      paragraphs.length > 0 ? paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join("\n") : "";

    // Extract tweet date from Snowflake ID
    const tweetDate = getDateFromSnowflakeId(tweetInfo.tweetId);
    const dateStr = tweetDate ? ` · ${formatBylineDate(tweetDate)}` : "";

    // Byline with link to author profile and date
    const authorUrl = `https://twitter.com/${tweetInfo.username}`;
    const bylineHtml = `<a href="${authorUrl}" rel="noopener noreferrer" target="_blank">@${tweetInfo.username}</a>${dateStr}`;

    return {
      title: generateTweetTitle(tweetInfo.username, ogDescription),
      byline: bylineHtml,
      content,
      textContent: ogDescription,
      excerpt,
      siteName: ogSiteName || "Twitter",
      language: null,
    };
  } catch {
    return null;
  }
}

/**
 * Extract tweet content from a Twitter/X URL
 * Tries oEmbed first, falls back to FxTwitter
 */
export async function extractTweet(url: string): Promise<ExtractedContent | null> {
  // X Articles (/article/) are not supported - they require authentication
  // and don't work with oEmbed or FxTwitter
  if (isArticleUrl(url)) {
    // Return a placeholder result so we don't fall back to Readability
    // (which would just extract the login page)
    const match = url.match(TWITTER_ARTICLE_PATTERN);
    const username = match ? match[1] : "unknown";
    const articleId = match ? match[2] : null;

    // Extract article date from Snowflake ID
    const articleDate = articleId ? getDateFromSnowflakeId(articleId) : null;
    const dateStr = articleDate ? ` · ${formatBylineDate(articleDate)}` : "";

    return {
      title: `X Article by @${username}`,
      byline: `<a href="https://x.com/${username}" rel="noopener noreferrer" target="_blank">@${username}</a>${dateStr}`,
      content: `<p>X Articles require authentication and cannot be snapshotted. <a href="${url}" rel="noopener noreferrer" target="_blank">View the original article on X</a>.</p>`,
      textContent: "X Articles require authentication and cannot be snapshotted.",
      excerpt: "X Articles require authentication and cannot be snapshotted.",
      siteName: "X",
      language: null,
    };
  }

  // Try Twitter oEmbed API first (official, most reliable)
  const oembedResult = await tryTwitterOEmbed(url);
  if (oembedResult) {
    return oembedResult;
  }

  // Fall back to FxTwitter
  const fxResult = await tryFxTwitter(url);
  if (fxResult) {
    return fxResult;
  }

  return null;
}

// ============================================================================
// Domain Extractor Registry
// ============================================================================

interface DomainHandler {
  matcher: (url: string) => boolean;
  extractor: (url: string) => Promise<ExtractedContent | null>;
}

/**
 * Registry of domain-specific extractors
 * Order matters - first match wins
 */
const DOMAIN_HANDLERS: DomainHandler[] = [
  {
    matcher: isTwitterUrl,
    extractor: extractTweet,
  },
  {
    matcher: isRedditUrl,
    extractor: extractReddit,
  },
];

/**
 * Get a domain-specific extractor for a URL, if one exists
 * Returns null if no specialized handler is registered for this domain
 */
export function getDomainExtractor(
  url: string
): ((url: string) => Promise<ExtractedContent | null>) | null {
  for (const handler of DOMAIN_HANDLERS) {
    if (handler.matcher(url)) {
      return handler.extractor;
    }
  }
  return null;
}

/**
 * Check if a URL has a domain-specific extractor available
 */
export function hasDomainExtractor(url: string): boolean {
  return getDomainExtractor(url) !== null;
}
