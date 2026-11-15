import { z } from "zod";

import { DEMO_AUDIENCES, DEMO_POST_TYPES } from "@/server/posts/demo-post-store";

const nonEmptyText = (maxLength: number) =>
  z.string().trim().min(1, "REQUIRED").max(maxLength, "TOO_LONG");

export const postFileSchema = z.object({
  fileName: z.string().trim().min(1).max(255),
  mimeType: z.string().trim().min(1).max(127),
  size: z.number().int().min(1).max(15 * 1024 * 1024),
  dataBase64: z.string().min(1),
});

export const createPostSchema = z.object({
  authorName: nonEmptyText(100),
  subject: nonEmptyText(80),
  grade: z.number().int().min(0).max(6),
  title: nonEmptyText(160),
  description: nonEmptyText(4_000),
  type: z.enum(DEMO_POST_TYPES),
  audience: z.enum(DEMO_AUDIENCES).optional().default("ALL"),
  file: postFileSchema.optional(),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
