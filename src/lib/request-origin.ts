import type { NextRequest } from "next/server";

function expectedHost(request: NextRequest): string | null {
  return request.headers.get("x-forwarded-host") ?? request.headers.get("host");
}

function expectedProtocol(request: NextRequest): string {
  const forwardedProtocol = request.headers.get("x-forwarded-proto");
  return forwardedProtocol?.split(",")[0]?.trim() ?? request.nextUrl.protocol.replace(":", "");
}

function isArenaDevelopmentPreview(origin: URL): boolean {
  return (
    process.env.NODE_ENV !== "production" &&
    origin.protocol === "https:" &&
    /^\d+-[a-z0-9]+\.e2b\.app$/i.test(origin.host)
  );
}

/**
 * Compares the browser origin to the host/protocol that reached this request.
 * Arena's reverse proxy terminates HTTPS outside the development server and may
 * rewrite Host, so its documented preview host is accepted in development only.
 */
export function isRequestSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  const host = expectedHost(request);

  if (!origin || !host) {
    return false;
  }

  try {
    const parsedOrigin = new URL(origin);
    const proxyOriginMatches =
      parsedOrigin.host === host &&
      parsedOrigin.protocol === `${expectedProtocol(request)}:`;

    return proxyOriginMatches || isArenaDevelopmentPreview(parsedOrigin);
  } catch {
    return false;
  }
}
