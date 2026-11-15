import type { NextRequest, NextResponse } from "next/server";

import {
  getSessionFromCookieValue,
  SESSION_COOKIE_NAME,
} from "@/server/auth/session-service";
import { apiError, apiData } from "@/server/security/api-response";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = getSessionFromCookieValue(
    request.cookies.get(SESSION_COOKIE_NAME)?.value,
  );

  if (!session) {
    return apiError("UNAUTHENTICATED", "Authentication is required.", 401);
  }

  return apiData({
    user: session.principal,
    expiresAt: session.expiresAt.toISOString(),
    idleExpiresAt: session.idleExpiresAt.toISOString(),
  });
}
