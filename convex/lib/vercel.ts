/**
 * Direct Vercel API client for Convex actions.
 * Calls Vercel REST API directly without going through Next.js.
 */

const VERCEL_API_BASE = "https://api.vercel.com";

interface VercelErrorResponse {
  error?: {
    code?: string;
    message?: string;
  };
}

interface VercelDomainResponse {
  name: string;
  verified: boolean;
  verification?: Array<{
    type: string;
    domain: string;
    value: string;
    reason: string;
  }>;
  misconfigured?: boolean;
}

export interface AddDomainResult {
  success: boolean;
  domain?: {
    name: string;
    verified: boolean;
    verification?: Array<{ type: string; domain: string; value: string }>;
  };
  error?: string;
  verificationRequired?: boolean;
  verification?: Array<{ type: string; domain: string; value: string }>;
}

export interface DomainConfigResult {
  success: boolean;
  verified?: boolean;
  misconfigured?: boolean;
  verification?: Array<{ type: string; domain: string; value: string }>;
  error?: string;
}

export interface VerifyDomainResult {
  success: boolean;
  verified: boolean;
  verification?: Array<{ type: string; domain: string; value: string }>;
  error?: string;
}

function getVercelConfig() {
  const token = process.env.VERCEL_TOKEN;
  const teamId = process.env.VERCEL_TEAM_ID;
  const projectId = process.env.VERCEL_PROJECT_ID;

  if (!token || !teamId || !projectId) {
    return null;
  }

  return { token, teamId, projectId };
}

function getTeamQuery(teamId: string): string {
  return `teamId=${teamId}`;
}

/**
 * Parse Vercel API error response into a user-friendly message
 */
function parseVercelError(status: number, body: VercelErrorResponse): string {
  const code = body.error?.code;
  const message = body.error?.message;

  // User-friendly messages for common errors
  if (code === "domain_already_in_use") {
    return "This domain is already in use by another Vercel project. You may need to verify ownership.";
  }
  if (code === "invalid_domain") {
    return "Invalid domain format. Please check the domain name.";
  }
  if (code === "forbidden" || status === 403) {
    return "Permission denied. The Vercel API token may lack required permissions.";
  }
  if (code === "rate_limit_exceeded" || status === 429) {
    return "Rate limit exceeded. Please try again later.";
  }
  if (code === "not_found" || status === 404) {
    return "Domain not found in Vercel project.";
  }

  // Return the API message if available
  if (message) {
    return message;
  }

  return `Vercel API error (${status}): ${code || "unknown"}`;
}

/**
 * Add a domain to the Vercel project
 */
export async function addDomainToVercel(domain: string): Promise<AddDomainResult> {
  const config = getVercelConfig();
  if (!config) {
    return { success: false, error: "Vercel not configured. Set VERCEL_TOKEN, VERCEL_TEAM_ID, and VERCEL_PROJECT_ID." };
  }

  try {
    const response = await fetch(
      `${VERCEL_API_BASE}/v10/projects/${config.projectId}/domains?${getTeamQuery(config.teamId)}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: domain }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: parseVercelError(response.status, data) };
    }

    const domainData = data as VercelDomainResponse;
    const needsVerification = domainData.verification && domainData.verification.length > 0;

    return {
      success: true,
      domain: {
        name: domainData.name,
        verified: domainData.verified || false,
        verification: domainData.verification,
      },
      verificationRequired: needsVerification,
      verification: domainData.verification,
    };
  } catch (error) {
    console.error("Failed to add domain to Vercel:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to connect to Vercel API",
    };
  }
}

/**
 * Remove a domain from the Vercel project
 */
export async function removeDomainFromVercel(domain: string): Promise<{ success: boolean; error?: string }> {
  const config = getVercelConfig();
  if (!config) {
    return { success: false, error: "Vercel not configured" };
  }

  try {
    const response = await fetch(
      `${VERCEL_API_BASE}/v9/projects/${config.projectId}/domains/${domain}?${getTeamQuery(config.teamId)}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${config.token}`,
        },
      }
    );

    if (!response.ok) {
      const data = await response.json();
      return { success: false, error: parseVercelError(response.status, data) };
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to remove domain from Vercel:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to connect to Vercel API",
    };
  }
}

/**
 * Verify a domain on Vercel
 */
export async function verifyDomainOnVercel(domain: string): Promise<VerifyDomainResult> {
  const config = getVercelConfig();
  if (!config) {
    return { success: false, verified: false, error: "Vercel not configured" };
  }

  try {
    const response = await fetch(
      `${VERCEL_API_BASE}/v9/projects/${config.projectId}/domains/${domain}/verify?${getTeamQuery(config.teamId)}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.token}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      // Get current config to include verification info
      const configResult = await getDomainConfigFromVercel(domain);
      return {
        success: false,
        verified: false,
        verification: configResult.verification,
        error: parseVercelError(response.status, data),
      };
    }

    const domainData = data as VercelDomainResponse;
    return {
      success: true,
      verified: domainData.verified || false,
      verification: domainData.verification,
    };
  } catch (error) {
    console.error("Failed to verify domain on Vercel:", error);
    return {
      success: false,
      verified: false,
      error: error instanceof Error ? error.message : "Failed to connect to Vercel API",
    };
  }
}

/**
 * Get domain configuration from Vercel
 */
export async function getDomainConfigFromVercel(domain: string): Promise<DomainConfigResult> {
  const config = getVercelConfig();
  if (!config) {
    return { success: false, error: "Vercel not configured" };
  }

  try {
    const response = await fetch(
      `${VERCEL_API_BASE}/v9/projects/${config.projectId}/domains/${domain}?${getTeamQuery(config.teamId)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${config.token}`,
        },
      }
    );

    if (!response.ok) {
      const data = await response.json();
      return { success: false, error: parseVercelError(response.status, data) };
    }

    const data = (await response.json()) as VercelDomainResponse;
    return {
      success: true,
      verified: data.verified || false,
      misconfigured: data.misconfigured || false,
      verification: data.verification,
    };
  } catch (error) {
    console.error("Failed to get domain config from Vercel:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to connect to Vercel API",
    };
  }
}
