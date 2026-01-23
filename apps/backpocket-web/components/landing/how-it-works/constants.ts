export const BROWSER_ARTICLE = {
  title: "The Future of AI in Software Development",
  url: "techcrunch.com/2026/01/future-ai-software",
  siteName: "TechCrunch",
};

export const WEB_ARTICLE = {
  title: "Understanding React Server Components",
  url: "https://vercel.com/blog/react-server-components",
  siteName: "Vercel Blog",
};

export const RSS_ITEMS = [
  { title: "Design Systems at Scale", source: "figma.com" },
  { title: "AWS Cost Optimization", source: "github.com" },
  { title: "React 19 Features", source: "react.dev" },
];

export const NEW_RSS_ITEM = { title: "Proof of Corn", source: "proofofcorn.com" };

export type BrowserPhase = "browsing" | "clicking" | "saving" | "saved" | "appearing";
export type MobilePhase = "article" | "share-sheet" | "app-opening" | "saved" | "complete";
export type WebPhase = "empty" | "pasting" | "processing" | "saved" | "complete";
export type RssPhase = "idle" | "saving" | "updating" | "complete";
