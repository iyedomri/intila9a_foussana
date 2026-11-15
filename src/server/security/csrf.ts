import "server-only";

import type { NextRequest } from "next/server";

import {
  isArenaDevelopmentPreviewRequest,
  isRequestSameOrigin,
} from "@/lib/request-origin";

import { generateOpaqueToken, safeStringEqual } from "./crypto";

export const CSRF_COOKIE_NAME = "if_csrf";
const CSRF_HEADER_NAME = "x-csrf-token";

export function createCsrfToken(): string {
  return generateOpaqueToken(32);
}

export function hasValidCsrfToken(request: NextRequest): boolean {
  const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;
  const headerToken = request.headers.get(CSRF_HEADER_NAME);

  return Boolean(
    cookieToken && headerToken && safeStringEqual(cookieToken, headerToken),
  );
}

export function hasValidMutationOrigin(request: NextRequest): boolean {
  if (isRequestSameOrigin(request) && hasValidCsrfToken(request)) {
    return true;
  }

  // Arena's HTTPS preview proxy can prevent the development server from seeing
  // the browser's CSRF cookie. Restrict this compatibility path to the preview
  // hostname and never enable it in production.
  return isArenaDevelopmentPreviewRequest(request);
}
