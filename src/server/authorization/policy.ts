import "server-only";

import type { SessionPrincipal, UserRole } from "@/server/auth/types";

export class AuthorizationError extends Error {
  public constructor() {
    super("FORBIDDEN");
    this.name = "AuthorizationError";
  }
}

export function requireRole(
  principal: SessionPrincipal,
  allowedRoles: readonly UserRole[],
): SessionPrincipal {
  if (!allowedRoles.includes(principal.role)) {
    throw new AuthorizationError();
  }

  return principal;
}

export function canManageUsers(principal: SessionPrincipal): boolean {
  return principal.role === "DIRECTOR";
}

export function canCreateEvents(principal: SessionPrincipal): boolean {
  return principal.role === "DIRECTOR";
}

export function canModerateAllContent(principal: SessionPrincipal): boolean {
  return principal.role === "DIRECTOR";
}

export function canCreatePosts(principal: SessionPrincipal): boolean {
  return principal.role === "DIRECTOR" || principal.role === "TEACHER";
}

export function canEditPost(
  principal: SessionPrincipal,
  postAuthorId: string,
): boolean {
  return principal.role === "DIRECTOR" || principal.id === postAuthorId;
}

export function canRestorePost(principal: SessionPrincipal): boolean {
  return principal.role === "DIRECTOR";
}
