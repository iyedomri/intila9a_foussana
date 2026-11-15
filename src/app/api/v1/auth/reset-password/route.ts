import type { NextRequest} from "next/server";
import { NextResponse } from "next/server";

import { resetPasswordSchema } from "@/server/auth/password-policy";
import { resetPassword } from "@/server/auth/session-service";
import { apiError } from "@/server/security/api-response";
import { hasValidMutationOrigin } from "@/server/security/csrf";

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!hasValidMutationOrigin(request)) {
    return apiError("CSRF_REJECTED", "The request could not be verified.", 403);
  }

  const body: unknown = await request.json().catch(() => null);
  const parsed = resetPasswordSchema.safeParse(body);

  if (!parsed.success) {
    return apiError("INVALID_RESET", "The reset link is invalid or expired.", 400);
  }

  const wasReset = await resetPassword(parsed.data.token, parsed.data.newPassword);

  if (!wasReset) {
    return apiError("INVALID_RESET", "The reset link is invalid or expired.", 400);
  }

  return NextResponse.json(
    { data: { reset: true } },
    { headers: { "Cache-Control": "no-store" } },
  );
}
