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

  it("accepts a post with an attached PDF document", () => {
    const postWithPdf = {
      ...validPost,
      file: {
        fileName: "cours_fractions.pdf",
        mimeType: "application/pdf",
        size: 1024 * 50,
        dataBase64: "JVBERi0xLjQKJeLjz9MKMSAwIG9ia...",
      },
    };
    expect(createPostSchema.safeParse(postWithPdf).success).toBe(true);
  });

  it("accepts school-wide announcements with audience targeting", () => {
    const schoolWidePost = {
      ...validPost,
      grade: 0,
      type: "ANNOUNCEMENT",
      audience: "PARENTS",
    };
    const parsed = createPostSchema.safeParse(schoolWidePost);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.grade).toBe(0);
      expect(parsed.data.type).toBe("ANNOUNCEMENT");
      expect(parsed.data.audience).toBe("PARENTS");
    }

    const teacherOnlyPost = {
      ...validPost,
      grade: 0,
      type: "ANNOUNCEMENT",
      audience: "TEACHERS",
    };
    const parsedTeacher = createPostSchema.safeParse(teacherOnlyPost);
    expect(parsedTeacher.success).toBe(true);
    if (parsedTeacher.success) {
      expect(parsedTeacher.data.audience).toBe("TEACHERS");
    }
  });

  it("rejects files exceeding size limits", () => {
    const postWithBigFile = {
      ...validPost,
      file: {
        fileName: "huge.pdf",
        mimeType: "application/pdf",
        size: 20 * 1024 * 1024, // 20 MB > 15 MB
        dataBase64: "AAAA...",
      },
    };
    expect(createPostSchema.safeParse(postWithBigFile).success).toBe(false);
  });

  it("rejects unsupported grades and empty author data", () => {
    expect(createPostSchema.safeParse({ ...validPost, grade: 7 }).success).toBe(false);
    expect(createPostSchema.safeParse({ ...validPost, authorName: " " }).success).toBe(false);
    expect(createPostSchema.safeParse({ ...validPost, subject: "" }).success).toBe(false);
  });
});
