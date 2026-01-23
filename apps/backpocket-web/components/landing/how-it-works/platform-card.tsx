import { Github } from "lucide-react";
import Link from "next/link";

interface PlatformCardProps {
  name: string;
  description: string;
  logo: React.ReactNode;
  gradient: string;
  status: "available" | "development";
  href?: string;
  repoHref?: string;
}

export function PlatformCard({
  name,
  description,
  logo,
  gradient,
  status,
  href,
  repoHref,
}: PlatformCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-dashed border-denim/30 bg-card/50 p-5 sm:p-6 text-center transition-all hover:border-denim/50 hover:bg-card">
      <div className="absolute inset-0 bg-linear-to-br from-denim/5 via-transparent to-rust/5 opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="relative">
        <div
          className={`mx-auto mb-4 flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-linear-to-br ${gradient}`}
        >
          {logo}
        </div>
        <h3 className="mb-1 text-base sm:text-lg font-semibold">{name}</h3>
        <p className="text-xs sm:text-sm text-muted-foreground">{description}</p>
        <div className="mt-4 flex flex-col items-center gap-2">
          {status === "available" ? (
            <Link
              href={href || "#"}
              className="inline-flex items-center rounded-full bg-mint/15 px-3 py-1 text-xs font-medium text-mint hover:bg-mint/25 transition-colors"
            >
              Available Now
            </Link>
          ) : (
            <span className="inline-flex items-center rounded-full bg-denim/10 px-3 py-1 text-xs font-medium text-denim">
              In Development
            </span>
          )}
          {repoHref && (
            <a
              href={repoHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <Github className="h-3.5 w-3.5" />
              View source
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
