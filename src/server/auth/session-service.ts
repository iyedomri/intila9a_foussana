import "server-only";

import { cookies } from "next/headers";

import {
  attemptDemoLogin,
  completeDemoPasswordReset,
  createDemoPasswordReset,
  getDemoSession,
  getLatestDemoSessionForRole,
  revokeAllDemoSessions,
  revokeDemoSession,
} from "./demo-auth-store";
import type { AuthenticatedSession, LoginAttemptResult, UserRole } from "./types";

export const SESSION_COOKIE_NAME = "if_session";

export function isDemoModeEnabled(): boolean {
  if (
    process.env.ENABLE_DEMO_MODE === "true" ||
    process.env.NEXT_PUBLIC_DEMO_MODE === "true" ||
    process.env.APP_MODE === "demo"
  ) {
    return true;
  }

  return process.env.NODE_ENV !== "production";
}

function assertLocalDemoMode(): void {
  if (!isDemoModeEnabled()) {
    throw new Error("DEMO_AUTH_DISABLED_IN_PRODUCTION");
  }
}

export async function loginWithPassword(
  email: string,
  password: string,
): Promise<LoginAttemptResult> {
  // The demo adapter is available for local visual testing or demo deployments.
  // The production Prisma-backed adapter is introduced with the persistent application layer.
  assertLocalDemoMode();
  return attemptDemoLogin(email, password);
}

export async function getCurrentSession(
  fallbackRole?: UserRole,
): Promise<AuthenticatedSession | null> {
  if (!isDemoModeEnabled()) {
    return null;
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = getDemoSession(token);

  if (session) {
    return session;
  }

  if (fallbackRole) {
    return getLatestDemoSessionForRole(fallbackRole);
  }

  return null;
}

export function getSessionFromCookieValue(
  token: string | undefined,
): AuthenticatedSession | null {
  return getDemoSession(token);
}

export { getDemoSession, getLatestDemoSessionForRole };

export function revokeSession(token: string | undefined): void {
  revokeDemoSession(token);
}

export function revokeAllSessions(userId: string): void {
  revokeAllDemoSessions(userId);
}

export function requestPasswordReset(email: string): string | null {
  return createDemoPasswordReset(email);
}

export async function resetPassword(token: string, newPassword: string): Promise<boolean> {
  return completeDemoPasswordReset(token, newPassword);
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "none" as const,
  secure: true,
  path: "/",
  maxAge: 8 * 60 * 60,
};
