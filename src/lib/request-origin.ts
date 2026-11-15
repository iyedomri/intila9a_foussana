import type { NextRequest } from "next/server";

function expectedHost(request: NextRequest): string | null {
  const forwardedHost = request.headers.get("x-forwarded-host");
  if (forwardedHost) {
    return forwardedHost.split(",")[0]?.trim() ?? null;
  }
  return request.headers.get("host");
}

function expectedProtocol(request: NextRequest): string {
  const forwardedProtocol = request.headers.get("x-forwarded-proto");
  return forwardedProtocol?.split(",")[0]?.trim() ?? request.nextUrl.protocol.replace(":", "");
}

function isArenaDevelopmentPreview(origin: URL): boolean {
  return (
    process.env.NODE_ENV !== "production" &&
    origin.protocol === "https:" &&
    (origin.host.endsWith(".e2b.app") || /^\d+-[a-z0-9-]+\.e2b\.app$/i.test(origin.host))
  );
}

export function isArenaDevelopmentPreviewRequest(request: NextRequest): boolean {
  const origin = request.headers.get("origin");

  if (!origin) {
    return false;
  }

  try {
    return isArenaDevelopmentPreview(new URL(origin));
  } catch {
    return false;
  }
}

/**
 * Compares the browser origin to the host/protocol that reached this request.
 * Arena's reverse proxy terminates HTTPS outside the development server and may
 * rewrite Host, so its documented preview host is accepted in development only.
 * On Vercel, requests originating from the same deployment (*.vercel.app or matching host)
 * are accepted.
 */
export function isRequestSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");

  // Requests without an Origin header (e.g. standard same-origin navigation or internal calls)
  if (!origin) {
    return true;
  }

  const host = expectedHost(request);

  try {
    const parsedOrigin = new URL(origin);

    // Direct match against Next.js route host
    if (parsedOrigin.host === request.nextUrl.host) {
      return true;
    }

    // Direct match against host header or forwarded host
    if (host && parsedOrigin.host === host) {
      return true;
    }

    // Matches Vercel deployment URLs (*.vercel.app)
    if (parsedOrigin.hostname.endsWith(".vercel.app")) {
      return true;
    }

    const proxyOriginMatches =
      parsedOrigin.host === host &&
      parsedOrigin.protocol === `${expectedProtocol(request)}:`;

    return proxyOriginMatches || isArenaDevelopmentPreview(parsedOrigin);
  } catch {
    return false;
  }
}
