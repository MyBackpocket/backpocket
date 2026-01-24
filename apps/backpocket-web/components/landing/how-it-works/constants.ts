export const BROWSER_ARTICLE = {
  title: "Why PoE2 Early Access Already Feels Like a Masterpiece",
  url: "reddit.com/r/pathofexile2/poe2-early-access",
  siteName: "r/pathofexile2",
};

export const WEB_ARTICLE = {
  title: "Why San Marzano Tomatoes Are Non-Negotiable",
  url: "https://bolognese.mariolopez.org/san-marzano",
  siteName: "The Bolognese Blog",
};

export const RSS_ITEMS = [
  { title: "Monaco GP Tire Strategy Deep Dive", source: "the-race.com" },
  { title: "Coachella 2026: Who's Headlining?", source: "pitchfork.com" },
  { title: "Cursor + Claude: AI Pair Programming", source: "anthropic.com" },
];

export const NEW_RSS_ITEM = { title: "PoE2 Endgame Atlas Guide", source: "maxroll.gg" };

export type BrowserPhase = "browsing" | "clicking" | "saving" | "saved" | "appearing";
export type MobilePhase = "article" | "share-sheet" | "app-opening" | "saved" | "complete";
export type WebPhase = "empty" | "pasting" | "processing" | "saved" | "complete";
export type RssPhase = "idle" | "saving" | "updating" | "complete";
