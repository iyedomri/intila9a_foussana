import type { NextRequest } from "next/server";

function expectedHost(request: NextRequest): string | null {
  return request.headers.get("x-forwarded-host") ?? request.headers.get("host");
}

function expectedProtocol(request: NextRequest): string {
  const forwardedProtocol = request.headers.get("x-forwarded-proto");
  return forwardedProtocol?.split(",")[0]?.trim() ?? request.nextUrl.protocol.replace(":", "");
}

/**
 * Compares the browser origin to the host/protocol that reached this request.
 * This also supports Arena's preview proxy, which forwards the public host.
 */
export function isRequestSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  const host = expectedHost(request);

  if (!origin || !host) {
    return false;
  }

  try {
    const parsedOrigin = new URL(origin);
    return parsedOrigin.host === host && parsedOrigin.protocol === `${expectedProtocol(request)}:`;
  } catch {
    return false;
  }
}
