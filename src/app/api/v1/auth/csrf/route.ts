import type { NextRequest} from "next/server";
import { NextResponse } from "next/server";

import { CSRF_COOKIE_NAME, createCsrfToken } from "@/server/security/csrf";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const token = createCsrfToken();
  const response = NextResponse.json(
    { data: { token } },
    { headers: { "Cache-Control": "no-store" } },
  );

  response.cookies.set(CSRF_COOKIE_NAME, token, {
    httpOnly: false,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60,
  });

  // A CSRF bootstrap token must only be issued to the same origin.
  if (request.headers.get("sec-fetch-site") === "cross-site") {
    return new NextResponse(null, { status: 403 });
  }

  return response;
}
