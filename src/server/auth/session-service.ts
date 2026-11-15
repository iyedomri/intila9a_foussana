import "server-only";

import { cookies } from "next/headers";

import {
  attemptDemoLogin,
  completeDemoPasswordReset,
  createDemoPasswordReset,
  getDemoSession,
  revokeAllDemoSessions,
  revokeDemoSession,
} from "./demo-auth-store";
import type { AuthenticatedSession, LoginAttemptResult } from "./types";

export const SESSION_COOKIE_NAME = "if_session";

function assertLocalDemoMode(): void {
  if (process.env.NODE_ENV === "production") {
    throw new Error("DEMO_AUTH_DISABLED_IN_PRODUCTION");
  }
}

export async function loginWithPassword(
  email: string,
  password: string,
): Promise<LoginAttemptResult> {
  // The demo adapter is available only for local visual testing. The production
  // Prisma-backed adapter is introduced with the persistent application layer.
  assertLocalDemoMode();
  return attemptDemoLogin(email, password);
}

export async function getCurrentSession(): Promise<AuthenticatedSession | null> {
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  const cookieStore = await cookies();
  return getDemoSession(cookieStore.get(SESSION_COOKIE_NAME)?.value);
}

export function getSessionFromCookieValue(
  token: string | undefined,
): AuthenticatedSession | null {
  return getDemoSession(token);
}

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
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 8 * 60 * 60,
};
