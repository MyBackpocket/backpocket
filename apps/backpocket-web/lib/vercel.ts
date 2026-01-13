import { Vercel } from "@vercel/sdk";
import { VercelError } from "@vercel/sdk/models/vercelerror.js";

// Initialize Vercel client
const vercelToken = process.env.VERCEL_TOKEN;
const teamId = process.env.VERCEL_TEAM_ID;
const projectId = process.env.VERCEL_PROJECT_ID;

// Check if Vercel is configured
export const isVercelConfigured = !!(vercelToken && teamId && projectId);

// Create Vercel client (only if configured)
export const vercel = vercelToken
  ? new Vercel({
      bearerToken: vercelToken,
    })
  : null;

export const getTeamId = () => teamId || undefined;
export const getProjectId = () => projectId || "";

export interface DomainConfig {
  name: string;
  verified: boolean;
  verification?: {
    type: string;
    domain: string;
    value: string;
    reason: string;
  }[];
  configuredBy?: string;
  misconfigured?: boolean;
}

export interface AddDomainResult {
  success: boolean;
  domain?: DomainConfig;
  error?: string;
  verificationRequired?: boolean;
  verification?: {
    type: string;
    domain: string;
    value: string;
  }[];
}

/**
 * Add a domain to the Vercel project
 */
export async function addDomainToProject(domain: string): Promise<AddDomainResult> {
  if (!vercel || !projectId) {
    return { success: false, error: "Vercel not configured" };
  }

  try {
    const response = await vercel.projects.addProjectDomain({
      idOrName: projectId,
      teamId: teamId || undefined,
      requestBody: {
        name: domain,
      },
    });

    // Check if verification is required
    const needsVerification = response.verification && response.verification.length > 0;

    return {
      success: true,
      domain: {
        name: response.name,
        verified: response.verified || false,
        verification: response.verification,
      },
      verificationRequired: needsVerification,
      verification: response.verification,
    };
  } catch (error: unknown) {
    console.error("Failed to add domain to Vercel:", error);

    // Extract detailed error from Vercel SDK
    if (error instanceof VercelError) {
      const body = error.body as { error?: { code?: string; message?: string } } | undefined;
      const code = body?.error?.code;
      const message = body?.error?.message;

      // Return user-friendly error messages based on Vercel error codes
      if (code === "domain_already_in_use") {
        return {
          success: false,
          error: "This domain is already in use by another Vercel project. You may need to verify ownership.",
        };
      }
      if (code === "invalid_domain") {
        return { success: false, error: "Invalid domain format. Please check the domain name." };
      }
      if (code === "forbidden" || error.statusCode === 403) {
        return {
          success: false,
          error: "Permission denied. The Vercel API token may lack required permissions.",
        };
      }
      if (code === "rate_limit_exceeded") {
        return { success: false, error: "Rate limit exceeded. Please try again later." };
      }

      // Return the Vercel error message if available
      if (message) {
        return { success: false, error: message };
      }

      return { success: false, error: `Vercel error (${error.statusCode}): ${code || "unknown"}` };
    }

    const errorMessage = error instanceof Error ? error.message : "Failed to add domain";
    return { success: false, error: errorMessage };
  }
}

/**
 * Get domain configuration from Vercel
 */
export async function getDomainConfig(domain: string): Promise<DomainConfig | null> {
  if (!vercel || !projectId) {
    return null;
  }

  try {
    const response = await vercel.projects.getProjectDomain({
      idOrName: projectId,
      domain,
      teamId: teamId || undefined,
    });

    // Cast to access misconfigured property which may not be in the SDK types
    const responseData = response as typeof response & { misconfigured?: boolean };

    return {
      name: response.name,
      verified: response.verified || false,
      verification: response.verification,
      misconfigured: responseData.misconfigured,
    };
  } catch {
    return null;
  }
}

/**
 * Verify a domain on Vercel
 */
export async function verifyDomain(domain: string): Promise<{ verified: boolean; error?: string }> {
  if (!vercel || !projectId) {
    return { verified: false, error: "Vercel not configured" };
  }

  try {
    const response = await vercel.projects.verifyProjectDomain({
      idOrName: projectId,
      domain,
      teamId: teamId || undefined,
    });

    return { verified: response.verified || false };
  } catch (error: unknown) {
    console.error("Failed to verify domain on Vercel:", error);
    const errorMessage = extractVercelErrorMessage(error, "Verification failed");
    return { verified: false, error: errorMessage };
  }
}

/**
 * Remove a domain from the Vercel project
 */
export async function removeDomainFromProject(
  domain: string
): Promise<{ success: boolean; error?: string }> {
  if (!vercel || !projectId) {
    return { success: false, error: "Vercel not configured" };
  }

  try {
    await vercel.projects.removeProjectDomain({
      idOrName: projectId,
      domain,
      teamId: teamId || undefined,
    });
    return { success: true };
  } catch (error: unknown) {
    console.error("Failed to remove domain from Vercel:", error);
    const errorMessage = extractVercelErrorMessage(error, "Failed to remove domain");
    return { success: false, error: errorMessage };
  }
}

/**
 * Extract a user-friendly error message from a Vercel SDK error
 */
function extractVercelErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof VercelError) {
    const body = error.body as { error?: { code?: string; message?: string } } | undefined;
    const message = body?.error?.message;
    if (message) {
      return message;
    }
    const code = body?.error?.code;
    if (code) {
      return `Vercel error: ${code}`;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}
