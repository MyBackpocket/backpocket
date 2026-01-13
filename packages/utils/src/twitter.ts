/**
 * X/Twitter URL parsing utilities
 *
 * Extracts username and timestamp information from X/Twitter post URLs.
 * The timestamp is decoded from the Snowflake ID embedded in tweet URLs.
 */

// Twitter epoch: November 4, 2010 at 01:42:54.657 UTC
const TWITTER_EPOCH = BigInt("1288834974657");

// URL patterns for X/Twitter posts
const TWITTER_TWEET_PATTERNS = [
  /^https?:\/\/(?:www\.)?(?:twitter\.com|x\.com)\/(\w+)\/status\/(\d+)/i,
  /^https?:\/\/(?:mobile\.)?(?:twitter\.com|x\.com)\/(\w+)\/status\/(\d+)/i,
];

// X Articles use /article/ instead of /status/
const TWITTER_ARTICLE_PATTERN =
  /^https?:\/\/(?:www\.)?(?:twitter\.com|x\.com)\/(\w+)\/article\/(\d+)/i;

export interface TwitterUrlInfo {
  username: string;
  tweetId: string;
}

/**
 * Parse an X/Twitter URL to extract username and tweet ID
 *
 * @param url - The URL to parse
 * @returns Parsed info or null if not a valid tweet URL
 *
 * @example
 * parseTwitterUrl("https://x.com/elonmusk/status/1234567890")
 * // => { username: "elonmusk", tweetId: "1234567890" }
 */
export function parseTwitterUrl(url: string): TwitterUrlInfo | null {
  for (const pattern of TWITTER_TWEET_PATTERNS) {
    const match = url.match(pattern);
    if (match) {
      return {
        username: match[1],
        tweetId: match[2],
      };
    }
  }

  // Also handle article URLs
  const articleMatch = url.match(TWITTER_ARTICLE_PATTERN);
  if (articleMatch) {
    return {
      username: articleMatch[1],
      tweetId: articleMatch[2],
    };
  }

  return null;
}

/**
 * Extract timestamp from a Twitter/X Snowflake ID
 *
 * Twitter IDs encode the creation timestamp in the upper 41 bits.
 * This allows us to determine when a tweet was posted from just its ID.
 *
 * @param id - The Snowflake ID (tweet ID)
 * @returns Date object or null if ID is invalid
 *
 * @example
 * getDateFromSnowflakeId("1234567890123456789")
 * // => Date representing when the tweet was posted
 */
export function getDateFromSnowflakeId(id: string): Date | null {
  try {
    const snowflakeId = BigInt(id);
    // Timestamp is in the upper 41 bits (shift right 22 bits)
    const timestampMs = (snowflakeId >> BigInt(22)) + TWITTER_EPOCH;
    const date = new Date(Number(timestampMs));

    // Sanity check: date should be between Twitter's launch (2006) and far future
    if (date.getFullYear() < 2006 || date.getFullYear() > 2100) {
      return null;
    }

    return date;
  } catch {
    return null;
  }
}

/**
 * Check if a URL is from X/Twitter
 *
 * @param url - The URL to check
 * @returns true if URL is from twitter.com or x.com
 */
export function isTwitterUrl(url: string): boolean {
  return (
    TWITTER_TWEET_PATTERNS.some((pattern) => pattern.test(url)) || TWITTER_ARTICLE_PATTERN.test(url)
  );
}
