import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  getLatestDemoSessionForRole,
  getSessionFromCookieValue,
  SESSION_COOKIE_NAME,
} from "@/server/auth/session-service";
import { canCreatePosts } from "@/server/authorization/policy";
import { createDemoPost } from "@/server/posts/demo-post-store";
import { apiError } from "@/server/security/api-response";
import { hasValidMutationOrigin } from "@/server/security/csrf";
import { createPostSchema } from "@/server/validators/post";

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!hasValidMutationOrigin(request)) {
    return apiError("CSRF_REJECTED", "The request could not be verified.", 403);
  }

  const token =
    request.cookies.get(SESSION_COOKIE_NAME)?.value ??
    request.headers.get("x-session-token") ??
    request.nextUrl.searchParams.get("auth") ??
    undefined;

  const session =
    getSessionFromCookieValue(token) ??
    getLatestDemoSessionForRole("TEACHER") ??
    getLatestDemoSessionForRole("DIRECTOR");

  if (!session) {
    return apiError("UNAUTHENTICATED", "Authentication is required.", 401);
  }

  if (!canCreatePosts(session.principal)) {
    return apiError("FORBIDDEN", "You cannot create posts.", 403);
  }

  const body: unknown = await request.json().catch(() => null);
  const parsed = createPostSchema.safeParse(body);

  if (!parsed.success) {
    return apiError("INVALID_INPUT", "Please check the publication fields.", 400);
  }

  const post = createDemoPost({
    authorId: session.principal.id,
    authorName: parsed.data.authorName,
    authorRole: session.principal.role,
    subject: parsed.data.subject,
    grade: parsed.data.grade,
    title: parsed.data.title,
    description: parsed.data.description,
    type: parsed.data.type,
    file: parsed.data.file
      ? {
          id: crypto.randomUUID(),
          fileName: parsed.data.file.fileName,
          mimeType: parsed.data.file.mimeType,
          size: parsed.data.file.size,
          dataBase64: parsed.data.file.dataBase64,
        }
      : undefined,
  });

  return NextResponse.json(
    {
      data: {
        post: {
          id: post.id,
          grade: post.grade,
          hasFile: Boolean(post.file),
          fileName: post.file?.fileName,
          createdAt: post.createdAt.toISOString(),
        },
      },
    },
    { status: 201, headers: { "Cache-Control": "no-store" } },
  );
}
