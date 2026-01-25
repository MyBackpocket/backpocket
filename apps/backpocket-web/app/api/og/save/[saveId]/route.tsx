import { fetchQuery } from "convex/nextjs";
import { ImageResponse } from "next/og";
import { headers } from "next/headers";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { SPACE_SLUG_HEADER } from "@/lib/constants/headers";
import {
  extractCustomDomain,
  isCustomDomainSlug,
} from "@/lib/constants/public-space";

export const runtime = "edge";

// Image dimensions (standard OG image size)
const WIDTH = 1200;
const HEIGHT = 630;

// Helper to strip markdown for clean preview text
function stripMarkdown(text: string): string {
  return text
    .replace(/[#*_~`>\[\]()!]/g, "")
    .replace(/\n+/g, " ")
    .trim();
}

// Helper to truncate text
function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 3)}...`;
}

// Helper to get domain from URL
function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ saveId: string }> }
) {
  try {
    const { saveId } = await params;
    const headersList = await headers();
    const spaceSlug = headersList.get(SPACE_SLUG_HEADER);

    if (!spaceSlug) {
      return new Response("Not found", { status: 404 });
    }

    // Resolve space
    let space: { id: string; slug: string; name: string } | null;
    if (isCustomDomainSlug(spaceSlug)) {
      space = await fetchQuery(api.public.resolveSpaceByDomain, {
        domain: extractCustomDomain(spaceSlug),
      });
    } else {
      space = await fetchQuery(api.public.resolveSpaceBySlug, {
        slug: spaceSlug,
      });
    }

    if (!space) {
      return new Response("Not found", { status: 404 });
    }

    // Get the save
    const save = await fetchQuery(api.public.getPublicSave, {
      spaceId: space.id as Id<"spaces">,
      saveId: saveId as Id<"saves">,
    });

    if (!save) {
      return new Response("Not found", { status: 404 });
    }

    const title = truncate(save.title || "Untitled", 80);
    const siteName = save.siteName || getDomain(save.url);
    const notePreview = save.note
      ? truncate(stripMarkdown(save.note), 120)
      : null;

    // Generate the OG image
    const response = new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            padding: 60,
            // Dark gradient background, or with image if available
            background: save.imageUrl
              ? `linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.6) 50%, rgba(0,0,0,0.4) 100%)`
              : "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
            position: "relative",
          }}
        >
          {/* Background image if available - using img is required for ImageResponse */}
          {save.imageUrl && (
            // biome-ignore lint/a11y/useAltText: ImageResponse requires img element
            <img
              src={save.imageUrl}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                zIndex: -1,
              }}
            />
          )}

          {/* Site name / source */}
          <div
            style={{
              color: "#a0a0a0",
              fontSize: 24,
              marginBottom: 12,
              display: "flex",
            }}
          >
            {siteName}
          </div>

          {/* Title */}
          <div
            style={{
              color: "#ffffff",
              fontSize: notePreview ? 40 : 48,
              fontWeight: 600,
              lineHeight: 1.2,
              maxWidth: "90%",
              marginBottom: notePreview ? 16 : 0,
              display: "flex",
            }}
          >
            {title}
          </div>

          {/* User's note - shown if exists */}
          {notePreview && (
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
                marginTop: 8,
              }}
            >
              <span
                style={{ color: "#6b7280", fontSize: 28, display: "flex" }}
              >
                "
              </span>
              <div
                style={{
                  color: "#d1d5db",
                  fontSize: 24,
                  fontStyle: "italic",
                  lineHeight: 1.4,
                  maxWidth: "85%",
                  display: "flex",
                }}
              >
                {notePreview}
              </div>
            </div>
          )}

          {/* Backpocket branding - bottom right */}
          <div
            style={{
              position: "absolute",
              bottom: 30,
              right: 40,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            {/* Simple text logo instead of image to avoid CORS issues */}
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: 6,
                background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                style={{ color: "#ffffff", fontSize: 14, fontWeight: 700 }}
              >
                B
              </span>
            </div>
            <span style={{ color: "#888888", fontSize: 16, display: "flex" }}>
              backpocket
            </span>
          </div>
        </div>
      ),
      {
        width: WIDTH,
        height: HEIGHT,
        headers: {
          // Aggressive edge caching: 24h fresh, 7d stale-while-revalidate
          "Cache-Control":
            "public, s-maxage=86400, stale-while-revalidate=604800",
        },
      }
    );

    return response;
  } catch (error) {
    console.error("OG image generation error:", error);
    return new Response("Failed to generate image", { status: 500 });
  }
}
