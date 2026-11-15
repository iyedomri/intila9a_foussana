import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getPostById } from "@/server/posts/post-service";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  const post = await getPostById(id);

  if (!post || !post.file) {
    return new NextResponse("Document introuvable", { status: 404 });
  }

  const fileBuffer = Buffer.from(post.file.dataBase64, "base64");

  return new NextResponse(fileBuffer, {
    status: 200,
    headers: {
      "Content-Type": post.file.mimeType || "application/pdf",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(post.file.fileName)}"`,
      "Content-Length": String(fileBuffer.length),
      "Cache-Control": "public, max-age=3600",
    },
  });
}
