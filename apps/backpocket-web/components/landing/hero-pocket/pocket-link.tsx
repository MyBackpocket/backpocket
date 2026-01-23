import { externalLinks } from "@/lib/constants/links";

export function PocketLink() {
  return (
    <a
      href={externalLinks.pocketShutdown}
      target="_blank"
      rel="noopener noreferrer"
      className="text-foreground font-medium decoration-2 decoration-dashed decoration-rust/50 underline underline-offset-4 hover:decoration-rust hover:text-rust transition-colors"
    >
      Pocket
    </a>
  );
}
