export const USER_ROLES = ["DIRECTOR", "TEACHER", "STUDENT", "PARENT"] as const;

export type UserRole = (typeof USER_ROLES)[number];

export interface SessionPrincipal {
  readonly id: string;
  readonly email: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly role: UserRole;
  readonly mustChangePassword: boolean;
}

export interface AuthenticatedSession {
  readonly id: string;
  readonly expiresAt: Date;
  readonly idleExpiresAt: Date;
  readonly principal: SessionPrincipal;
}

export interface LoginResult {
  readonly token: string;
  readonly session: AuthenticatedSession;
}

export type LoginFailureReason = "INVALID_CREDENTIALS" | "LOCKED";

export type LoginAttemptResult =
  | { readonly ok: true; readonly result: LoginResult }
  | { readonly ok: false; readonly reason: LoginFailureReason };
