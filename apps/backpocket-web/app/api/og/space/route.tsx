import { fetchQuery } from "convex/nextjs";
import { ImageResponse } from "next/og";
import { headers } from "next/headers";
import { api } from "@convex/_generated/api";
import { SPACE_SLUG_HEADER } from "@/lib/constants/headers";
import {
  extractCustomDomain,
  isCustomDomainSlug,
} from "@/lib/constants/public-space";

export const runtime = "edge";

const WIDTH = 1200;
const HEIGHT = 630;

export async function GET() {
  try {
    const headersList = await headers();
    const spaceSlug = headersList.get(SPACE_SLUG_HEADER);

    if (!spaceSlug) {
      return new Response("Not found", { status: 404 });
    }

    // Resolve space
    let space: {
      id: string;
      slug: string;
      name: string;
      bio?: string | null;
      visitCount?: number;
    } | null = null;

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

    const name = space.name;
    const bio = space.bio || "A curated collection of links";
    const initial = name.charAt(0).toUpperCase();

    const response = new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            padding: 60,
            background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)",
            position: "relative",
          }}
        >
          {/* Decorative circles */}
          <div
            style={{
              position: "absolute",
              top: 60,
              right: 80,
              width: 200,
              height: 200,
              borderRadius: "50%",
              background: "rgba(59, 130, 246, 0.08)",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 150,
              right: 220,
              width: 100,
              height: 100,
              borderRadius: "50%",
              background: "rgba(59, 130, 246, 0.12)",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: 80,
              left: 100,
              width: 150,
              height: 150,
              borderRadius: "50%",
              background: "rgba(59, 130, 246, 0.06)",
            }}
          />

          {/* Avatar */}
          <div
            style={{
              width: 120,
              height: 120,
              borderRadius: 24,
              background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 32,
              boxShadow: "0 25px 50px -12px rgba(59, 130, 246, 0.4)",
            }}
          >
            <span style={{ color: "#ffffff", fontSize: 56, fontWeight: 700 }}>
              {initial}
            </span>
          </div>

          {/* Name */}
          <div
            style={{
              color: "#f1f5f9",
              fontSize: 56,
              fontWeight: 700,
              textAlign: "center",
              marginBottom: 16,
            }}
          >
            {name}&apos;s Backpocket
          </div>

          {/* Bio */}
          <div
            style={{
              color: "#94a3b8",
              fontSize: 28,
              textAlign: "center",
              maxWidth: 800,
              lineHeight: 1.4,
            }}
          >
            {bio.length > 120 ? `${bio.slice(0, 117)}...` : bio}
          </div>

          {/* Branding */}
          <div
            style={{
              position: "absolute",
              bottom: 40,
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
              backpocket.my
            </span>
          </div>
        </div>
      ),
      {
        width: WIDTH,
        height: HEIGHT,
        headers: {
          "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
        },
      }
    );

    return response;
  } catch (error) {
    console.error("Space OG image generation error:", error);
    return new Response("Failed to generate image", { status: 500 });
  }
}
