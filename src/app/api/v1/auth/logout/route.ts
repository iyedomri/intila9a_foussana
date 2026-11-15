import type { NextRequest} from "next/server";
import { NextResponse } from "next/server";

import {
  revokeSession,
  SESSION_COOKIE_NAME,
} from "@/server/auth/session-service";
import { apiError } from "@/server/security/api-response";
import { hasValidMutationOrigin } from "@/server/security/csrf";

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!hasValidMutationOrigin(request)) {
    return apiError("CSRF_REJECTED", "The request could not be verified.", 403);
  }

  revokeSession(request.cookies.get(SESSION_COOKIE_NAME)?.value);

  const response = NextResponse.json(
    { data: { loggedOut: true } },
    { headers: { "Cache-Control": "no-store" } },
  );
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  return response;
}
