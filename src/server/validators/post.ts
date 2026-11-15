import { z } from "zod";

import { DEMO_POST_TYPES } from "@/server/posts/demo-post-store";

const nonEmptyText = (maxLength: number) =>
  z.string().trim().min(1, "REQUIRED").max(maxLength, "TOO_LONG");

export const createPostSchema = z.object({
  authorName: nonEmptyText(100),
  subject: nonEmptyText(80),
  grade: z.number().int().min(1).max(6),
  title: nonEmptyText(160),
  description: nonEmptyText(4_000),
  type: z.enum(DEMO_POST_TYPES),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
