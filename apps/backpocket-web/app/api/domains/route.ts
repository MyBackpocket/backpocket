import { type NextRequest, NextResponse } from "next/server";
import {
  addDomainToProject,
  getDomainConfig,
  isVercelConfigured,
  removeDomainFromProject,
  verifyDomain,
} from "@/lib/vercel";

/**
 * Validate the internal API secret for Convex action calls.
 */
function validateAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return false;
  }

  const token = authHeader.slice(7);
  const expectedSecret = process.env.INTERNAL_API_SECRET;

  if (!expectedSecret) {
    console.error("INTERNAL_API_SECRET not configured");
    return false;
  }

  return token === expectedSecret;
}

/**
 * GET /api/domains - Get Vercel status for a domain
 * Used by Convex actions to check domain verification status.
 * The Convex action should pass the domain name directly (it already looked it up).
 */
export async function GET(request: NextRequest) {
  if (!validateAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const domain = searchParams.get("domain");

  if (!domain) {
    return NextResponse.json({ error: "domain is required" }, { status: 400 });
  }

  if (!isVercelConfigured) {
    return NextResponse.json({ error: "Vercel integration not configured" }, { status: 503 });
  }

  try {
    const vercelConfig = await getDomainConfig(domain);

    if (!vercelConfig) {
      return NextResponse.json({
        verified: false,
        misconfigured: false,
        verification: [],
      });
    }

    return NextResponse.json({
      verified: vercelConfig.verified,
      misconfigured: vercelConfig.misconfigured || false,
      verification: vercelConfig.verification || [],
    });
  } catch (error) {
    console.error("Failed to get domain config from Vercel:", error);
    return NextResponse.json({ error: "Failed to get domain config" }, { status: 500 });
  }
}

/**
 * POST /api/domains - Manage domains on Vercel
 * Actions: add, remove, verify, getConfig
 */
export async function POST(request: NextRequest) {
  if (!validateAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isVercelConfigured) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Vercel integration not configured. Please set VERCEL_TOKEN, VERCEL_TEAM_ID, and VERCEL_PROJECT_ID.",
      },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const { action, domain } = body;

    if (!action || !domain) {
      return NextResponse.json({ error: "action and domain are required" }, { status: 400 });
    }

    switch (action) {
      case "add": {
        const result = await addDomainToProject(domain);
        return NextResponse.json(result);
      }

      case "remove": {
        const result = await removeDomainFromProject(domain);
        return NextResponse.json(result);
      }

      case "verify": {
        const result = await verifyDomain(domain);
        // Get current config to include verification info
        const config = await getDomainConfig(domain);
        return NextResponse.json({
          success: !result.error,
          verified: result.verified,
          verification: config?.verification,
          error: result.error,
        });
      }

      case "getConfig": {
        const config = await getDomainConfig(domain);
        if (!config) {
          return NextResponse.json({ success: false, error: "Domain not found in Vercel" });
        }
        return NextResponse.json({ success: true, config });
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (error) {
    console.error("Domain API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
