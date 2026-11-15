import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  getLatestDemoSessionForRole,
  getSessionFromCookieValue,
  SESSION_COOKIE_NAME,
} from "@/server/auth/session-service";
import { canEditPost, canModerateAllContent } from "@/server/authorization/policy";
import { deletePost, getPostById } from "@/server/posts/post-service";
import { apiError } from "@/server/security/api-response";
import { hasValidMutationOrigin } from "@/server/security/csrf";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(
  _request: NextRequest,
  context: RouteParams,
): Promise<NextResponse> {
  const { id } = await context.params;
  const post = await getPostById(id);

  if (!post) {
    return apiError("NOT_FOUND", "Publication introuvable.", 404);
  }

  return NextResponse.json(
    {
      data: {
        post: {
          id: post.id,
          authorName: post.authorName,
          authorRole: post.authorRole,
          subject: post.subject,
          grade: post.grade,
          audience: post.audience ?? "ALL",
          title: post.title,
          description: post.description,
          type: post.type,
          hasFile: Boolean(post.file),
          fileName: post.file?.fileName,
          fileSize: post.file?.size,
          createdAt: post.createdAt.toISOString(),
          deletedAt: post.deletedAt?.toISOString() ?? null,
          deletedReason: post.deletedReason ?? null,
        },
      },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function DELETE(
  request: NextRequest,
  context: RouteParams,
): Promise<NextResponse> {
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
    getLatestDemoSessionForRole("DIRECTOR") ??
    getLatestDemoSessionForRole("TEACHER");

  if (!session) {
    return apiError("UNAUTHENTICATED", "Authentication is required.", 401);
  }

  const { id } = await context.params;
  const post = await getPostById(id);

  if (!post) {
    return apiError("NOT_FOUND", "Publication introuvable.", 404);
  }

  const isDirector = canModerateAllContent(session.principal);
  const isAuthor = canEditPost(session.principal, post.authorId);

  if (!isDirector && !isAuthor) {
    return apiError("FORBIDDEN", "Vous n'avez pas l'autorisation de supprimer cette publication.", 403);
  }

  const body = await request.json().catch(() => ({}));
  const reason = typeof body?.reason === "string" ? body.reason : "Supprimé par la Direction";

  const success = await deletePost(id, reason, session.principal.id);
  if (!success) {
    return apiError("NOT_FOUND", "Impossible de supprimer la publication.", 404);
  }

  return NextResponse.json(
    {
      data: {
        success: true,
        id,
        deletedAt: new Date().toISOString(),
      },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
