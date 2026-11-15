import { describe, expect, it } from "vitest";

import { createPostSchema } from "../../src/server/validators/post";

describe("teacher post validation", () => {
  const validPost = {
    authorName: "Nour Trabelsi",
    subject: "Mathématiques",
    grade: 1,
    type: "EXERCISE",
    title: "Révision des nombres",
    description: "Complétez les exercices 1 à 5.",
  };

  it("accepts a complete grade-scoped teacher post", () => {
    expect(createPostSchema.safeParse(validPost).success).toBe(true);
  });

  it("rejects unsupported grades and empty author data", () => {
    expect(createPostSchema.safeParse({ ...validPost, grade: 7 }).success).toBe(false);
    expect(createPostSchema.safeParse({ ...validPost, authorName: " " }).success).toBe(false);
    expect(createPostSchema.safeParse({ ...validPost, subject: "" }).success).toBe(false);
  });
});
