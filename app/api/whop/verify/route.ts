import { getUserById, updateUser } from "@/lib/data/users";
import { verifyWhopEntitlement } from "@/lib/whop/verify";

const JSON_HEADERS = {
  "content-type": "application/json"
};

async function parseBody(request: Request): Promise<Record<string, unknown>> {
  try {
    return await request.json();
  } catch (error) {
    return {};
  }
}

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: JSON_HEADERS
  });
}

export async function POST(request: Request): Promise<Response> {
  const payload = await parseBody(request);
  const userId = typeof payload.userId === "string" ? payload.userId : undefined;
  const accessToken = typeof payload.accessToken === "string" ? payload.accessToken : undefined;

  if (!userId) {
    return jsonResponse({ ok: false, error: "USER_ID_REQUIRED" }, 400);
  }

  const user = getUserById(userId);
  if (!user) {
    return jsonResponse({ ok: false, error: "USER_NOT_FOUND" }, 404);
  }

  const entitlement = await verifyWhopEntitlement({ userId, accessToken });
  if (!entitlement.valid) {
    return jsonResponse({ ok: false, error: "ENTITLEMENT_INVALID", entitlement }, 403);
  }

  const updatedUser = updateUser(userId, {
    isWhopSubscriber: true
  });

  return jsonResponse({ ok: true, user: updatedUser, entitlement });
}
