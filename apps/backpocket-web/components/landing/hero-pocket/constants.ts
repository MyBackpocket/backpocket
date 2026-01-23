import { DEFAULT_ROOT_DOMAIN } from "@/lib/config/public";

export const SAVE_CARDS = [
  {
    title: "A Complete Guide To AGENTS.md",
    source: "aihero.dev",
    hasImage: true,
    imageColor: "from-slate-800 to-slate-900",
  },
  {
    title: "Design Systems at Scale",
    source: "figma.com",
    hasImage: false,
  },
  {
    title: "AWS Cost Optimization",
    source: "github.com",
    hasImage: true,
    imageColor: "from-denim/20 to-teal/10",
  },
  {
    title: "React 19 Features",
    source: "react.dev",
    hasImage: true,
    imageColor: "from-sky-400/20 to-blue-500/10",
  },
] as const;

export const DOMAINS = [
  { url: `mario.${DEFAULT_ROOT_DOMAIN}`, isCustom: false },
  { url: "links.yoursite.com", isCustom: true },
  { url: `jackie.${DEFAULT_ROOT_DOMAIN}`, isCustom: false },
  { url: `your-name.${DEFAULT_ROOT_DOMAIN}`, isCustom: false },
];

export type AnimationPhase = "idle" | "saving" | "saved" | "fading";
