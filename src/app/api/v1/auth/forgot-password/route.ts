import type { NextRequest} from "next/server";
import { NextResponse } from "next/server";

import { forgotPasswordSchema } from "@/server/auth/password-policy";
import { requestPasswordReset } from "@/server/auth/session-service";
import { apiError } from "@/server/security/api-response";
import { hasValidMutationOrigin } from "@/server/security/csrf";

const GENERIC_FORGOT_RESPONSE = {
  accepted: true,
  message: "If the account exists, password-reset instructions will be sent.",
};

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!hasValidMutationOrigin(request)) {
    return apiError("CSRF_REJECTED", "The request could not be verified.", 403);
  }

  const body: unknown = await request.json().catch(() => null);
  const parsed = forgotPasswordSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { data: GENERIC_FORGOT_RESPONSE },
      { status: 202, headers: { "Cache-Control": "no-store" } },
    );
  }

  const resetToken = requestPasswordReset(parsed.data.email);
  const payload: {
    accepted: boolean;
    message: string;
    demoResetPath?: string;
  } = { ...GENERIC_FORGOT_RESPONSE };

  // Never expose reset material in production. This local-only convenience lets
  // reviewers exercise the complete reset flow without configuring an email provider.
  if (process.env.NODE_ENV !== "production" && resetToken) {
    payload.demoResetPath = `/reset-password?token=${encodeURIComponent(resetToken)}`;
  }

  return NextResponse.json(
    { data: payload },
    { status: 202, headers: { "Cache-Control": "no-store" } },
  );
}
