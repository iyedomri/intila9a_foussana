import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { isRequestSameOrigin } from "@/lib/request-origin";

const API_PREFIX = "/api/";

function contentSecurityPolicy(): string {
  const isDevelopment = process.env.NODE_ENV !== "production";
  const scriptSource = isDevelopment
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
    : "script-src 'self' 'unsafe-inline'";

  return [
    "default-src 'self'",
    scriptSource,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "media-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
}

function secureHeaders(response: NextResponse): void {
  response.headers.set("Content-Security-Policy", contentSecurityPolicy());
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=()");
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  response.headers.set("Cross-Origin-Resource-Policy", "same-origin");

  if (process.env.NODE_ENV === "production") {
    response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  }
}

function isAllowedApiOrigin(request: NextRequest): boolean {
  return !request.headers.get("origin") || isRequestSameOrigin(request);
}

export function proxy(request: NextRequest): NextResponse {
  if (request.nextUrl.pathname.startsWith(API_PREFIX) && !isAllowedApiOrigin(request)) {
    const response = NextResponse.json(
      { error: { code: "CORS_REJECTED", message: "Cross-origin requests are not allowed." } },
      { status: 403 },
    );
    secureHeaders(response);
    return response;
  }

  const response = NextResponse.next();
  secureHeaders(response);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
