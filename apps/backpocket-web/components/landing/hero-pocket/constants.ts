import { DEFAULT_ROOT_DOMAIN } from "@/lib/config/public";

export const SAVE_CARDS = [
  {
    id: "poe2-witch",
    title: "PoE2 Witch Minion Build Guide",
    source: "maxroll.gg",
    hasImage: true,
    imageColor: "from-purple-900 to-slate-900",
  },
  {
    id: "f1-verstappen",
    title: "Verstappen vs Norris: 2026 Preview",
    source: "the-race.com",
    hasImage: false,
  },
  {
    id: "coachella",
    title: "Coachella 2026: Set Times & Guide",
    source: "coachella.com",
    hasImage: true,
    imageColor: "from-pink-500/20 to-orange-500/10",
  },
  {
    id: "ollama",
    title: "Local LLMs with Ollama",
    source: "ollama.com",
    hasImage: true,
    imageColor: "from-sky-400/20 to-blue-500/10",
  },
  {
    id: "monaco-gp",
    title: "Monaco GP Tire Strategy",
    source: "formula1.com",
    hasImage: true,
    imageColor: "from-red-500/20 to-orange-500/10",
  },
] as const;

export const DOMAINS = [
  { url: `mario.${DEFAULT_ROOT_DOMAIN}`, isCustom: false },
  { url: "links.yoursite.com", isCustom: true },
  { url: `jackie.${DEFAULT_ROOT_DOMAIN}`, isCustom: false },
  { url: `your-name.${DEFAULT_ROOT_DOMAIN}`, isCustom: false },
];

export type AnimationPhase = "idle" | "saving" | "saved" | "fading";
