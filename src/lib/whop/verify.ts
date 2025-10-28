export interface VerifyWhopOptions {
  userId: string;
  accessToken?: string;
}

export interface WhopEntitlement {
  valid: boolean;
  subscription: {
    planId: string;
    status: "active" | "inactive";
    activatedAt: string;
  };
  raw: Record<string, unknown> | null;
  source: "stub" | "token";
}

function maskToken(token: string): string {
  if (token.length <= 8) return token;
  const visible = token.slice(-4);
  return `${"*".repeat(token.length - 4)}${visible}`;
}

/**
 * Temporary helper that mimics a Whop entitlement verification flow.
 * It is structured to support swapping in a real API request once
 * credentials and endpoints are available.
 */
export async function verifyWhopEntitlement({ userId, accessToken }: VerifyWhopOptions): Promise<WhopEntitlement> {
  const fallbackToken = process.env.WHOP_API_TOKEN;
  const token = accessToken || fallbackToken || "";
  const now = new Date().toISOString();

  if (!token) {
    return {
      valid: true,
      subscription: {
        planId: "stub-free-upgrade",
        status: "active",
        activatedAt: now
      },
      raw: {
        userId,
        note: "Stubbed entitlement without API token"
      },
      source: "stub"
    };
  }

  // Placeholder for future network request using the provided token.
  return {
    valid: true,
    subscription: {
      planId: "whop-pro",
      status: "active",
      activatedAt: now
    },
    raw: {
      userId,
      token: maskToken(token)
    },
    source: "token"
  };
}
