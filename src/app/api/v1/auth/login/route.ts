import type { NextRequest} from "next/server";
import { NextResponse } from "next/server";

import { loginSchema } from "@/server/auth/password-policy";
import {
  loginWithPassword,
  sessionCookieOptions,
  SESSION_COOKIE_NAME,
} from "@/server/auth/session-service";
import {
  clearLoginRateLimit,
  clientIpFromHeaders,
  isLoginRateLimited,
  recordFailedLogin,
} from "@/server/security/login-rate-limit";
import { apiError } from "@/server/security/api-response";
import { hasValidMutationOrigin } from "@/server/security/csrf";

const GENERIC_LOGIN_ERROR = "Unable to sign in with those credentials.";

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!hasValidMutationOrigin(request)) {
    return apiError("CSRF_REJECTED", "The request could not be verified.", 403);
  }

  const body: unknown = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return apiError("INVALID_CREDENTIALS", GENERIC_LOGIN_ERROR, 401);
  }

  const { email, password } = parsed.data;
  const ip = clientIpFromHeaders(request.headers);

  if (isLoginRateLimited(ip, email)) {
    return apiError("INVALID_CREDENTIALS", GENERIC_LOGIN_ERROR, 401);
  }

  const attempt = await loginWithPassword(email, password);

  if (!attempt.ok) {
    recordFailedLogin(ip, email);
    return apiError("INVALID_CREDENTIALS", GENERIC_LOGIN_ERROR, 401);
  }

  clearLoginRateLimit(email);
  const response = NextResponse.json(
    {
      data: {
        user: attempt.result.session.principal,
        token: attempt.result.token,
        mustChangePassword: attempt.result.session.principal.mustChangePassword,
      },
    },
    { headers: { "Cache-Control": "no-store" } },
  );

  response.cookies.set(SESSION_COOKIE_NAME, attempt.result.token, sessionCookieOptions);
  return response;
}
