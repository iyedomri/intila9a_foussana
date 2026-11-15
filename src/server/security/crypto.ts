import "server-only";

import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

import type { UserRole } from "@/server/auth/types";

const SIGNING_PEPPER =
  process.env.SESSION_PEPPER ||
  "intila9a-foussana-production-session-pepper-key-2026";

export interface SessionTokenPayload {
  readonly id: string;
  readonly email: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly role: UserRole;
  readonly mustChangePassword?: boolean;
  readonly expiresAt: string;
}

export function generateOpaqueToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function signSessionPayload(payload: SessionTokenPayload): string {
  const json = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = createHmac("sha256", SIGNING_PEPPER).update(json).digest("base64url");
  return `${json}.${signature}`;
}

export function verifySessionPayload(token: string | undefined): SessionTokenPayload | null {
  if (!token) return null;
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    const [jsonPart, sigPart] = parts;
    if (!jsonPart || !sigPart) return null;

    const expectedSig = createHmac("sha256", SIGNING_PEPPER).update(jsonPart).digest("base64url");
    if (!safeStringEqual(sigPart, expectedSig)) {
      return null;
    }

    const decoded = JSON.parse(Buffer.from(jsonPart, "base64url").toString("utf8")) as SessionTokenPayload;
    if (!decoded.id || !decoded.role || !decoded.expiresAt) {
      return null;
    }

    if (new Date(decoded.expiresAt).getTime() <= Date.now()) {
      return null;
    }

    return decoded;
  } catch {
    return null;
  }
}

export function safeStringEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left, "utf8");
  const rightBuffer = Buffer.from(right, "utf8");

  if (leftBuffer.length !== rightBuffer.length) {
    // Perform equivalent work before rejecting unequal lengths.
    timingSafeEqual(leftBuffer, leftBuffer);
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}
