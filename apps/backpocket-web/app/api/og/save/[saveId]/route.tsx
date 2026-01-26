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
    let space: { id: string; slug: string; name: string } | null = null;
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
    const hasNote = !!save.note;
    const notePreview = save.note
      ? truncate(stripMarkdown(save.note), 200)
      : null;

    // Generate the OG image - different designs based on whether there's a note
    const response = new ImageResponse(
      hasNote ? (
        // QUOTE CARD DESIGN - when user has added a note (like a tweet)
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            padding: 60,
            background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          }}
        >
          {/* Quote card container */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              width: "100%",
              maxWidth: 1000,
              background: "#1e293b",
              borderRadius: 24,
              border: "1px solid #334155",
              padding: 48,
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
            }}
          >
            {/* The note/quote - prominent and large */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                marginBottom: 32,
              }}
            >
              <span
                style={{
                  color: "#3b82f6",
                  fontSize: 48,
                  fontWeight: 300,
                  lineHeight: 0.8,
                  marginBottom: 8,
                }}
              >
                "
              </span>
              <div
                style={{
                  color: "#f1f5f9",
                  fontSize: 32,
                  fontWeight: 500,
                  lineHeight: 1.4,
                  paddingLeft: 24,
                }}
              >
                {notePreview}
              </div>
            </div>

            {/* Divider */}
            <div
              style={{
                width: "100%",
                height: 1,
                background: "#334155",
                marginBottom: 24,
              }}
            />

            {/* Source info - like a link preview within the card */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
              }}
            >
              {/* Site icon placeholder - external images can timeout on edge */}
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 10,
                  background: "linear-gradient(135deg, #475569 0%, #334155 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px solid #475569",
                }}
              >
                <span style={{ color: "#94a3b8", fontSize: 20 }}>🔗</span>
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  flex: 1,
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    color: "#94a3b8",
                    fontSize: 18,
                    marginBottom: 4,
                  }}
                >
                  {siteName}
                </div>
                <div
                  style={{
                    color: "#e2e8f0",
                    fontSize: 22,
                    fontWeight: 500,
                  }}
                >
                  {truncate(title, 60)}
                </div>
              </div>
            </div>
          </div>

          {/* Curator attribution - bottom */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginTop: 32,
              gap: 12,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span style={{ color: "#ffffff", fontSize: 18, fontWeight: 700 }}>
                B
              </span>
            </div>
            <span style={{ color: "#64748b", fontSize: 20 }}>
              Saved by {space.name} on backpocket
            </span>
          </div>
        </div>
      ) : (
        // STANDARD DESIGN - when there's no note
        // Note: We don't fetch external images to avoid timeout issues on edge
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            padding: 60,
            background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)",
            position: "relative",
          }}
        >
          {/* Decorative elements */}
          <div
            style={{
              position: "absolute",
              top: 40,
              right: 60,
              width: 120,
              height: 120,
              borderRadius: "50%",
              background: "rgba(59, 130, 246, 0.1)",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 100,
              right: 140,
              width: 60,
              height: 60,
              borderRadius: "50%",
              background: "rgba(59, 130, 246, 0.15)",
            }}
          />

          {/* Site name / source */}
          <div
            style={{
              color: "#94a3b8",
              fontSize: 24,
              marginBottom: 16,
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <span style={{ fontSize: 20 }}>🔗</span>
            {siteName}
          </div>

          {/* Title */}
          <div
            style={{
              color: "#f1f5f9",
              fontSize: 52,
              fontWeight: 600,
              lineHeight: 1.2,
              maxWidth: "85%",
              display: "flex",
            }}
          >
            {title}
          </div>

          {/* Curator info */}
          <div
            style={{
              marginTop: 32,
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span style={{ color: "#ffffff", fontSize: 18, fontWeight: 700 }}>
                B
              </span>
            </div>
            <span style={{ color: "#64748b", fontSize: 20 }}>
              Saved by {space.name} on backpocket
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
