import { readFileSync } from "node:fs";
import { join } from "node:path";
import { newDb } from "pg-mem";
import { describe, expect, it } from "vitest";

import {
  createPost,
  deletePost,
  getPostById,
  listAllPosts,
  listPostsByGrade,
  listTeacherAnnouncements,
} from "../../src/server/posts/post-service";
import {
  dbCreatePost,
  dbDeletePost,
  dbGetPostById,
  dbListAllPosts,
  dbListPostsByGrade,
  dbListTeacherPosts,
} from "../../src/server/db/posts";
import { seedDatabase } from "../../src/server/db/seed";
import { dbGetUserByEmail, dbVerifyUserPassword } from "../../src/server/db/users";

describe("PostgreSQL Database Layer", () => {
  async function createTestDb() {
    const memDb = newDb();

    // Register gen_random_uuid() function in pg-mem
    memDb.public.registerFunction({
      name: "gen_random_uuid",
      impure: true,
      implementation: () => crypto.randomUUID(),
    });

    const pool = memDb.adapters.createPg().Pool;
    const poolInstance = new pool();

    // Execute schema.sql
    const schemaPath = join(process.cwd(), "src/server/db/schema.sql");
    const ddl = readFileSync(schemaPath, "utf8");
    await poolInstance.query(ddl);

    // Seed database
    await seedDatabase(poolInstance);

    return poolInstance;
  }

  it("initializes tables and seeds Director, Teacher, and grades", async () => {
    const pool = await createTestDb();

    // Verify Director Fethi Omri
    const director = await pool.query(
      "SELECT email, first_name, last_name, role FROM users WHERE role = 'DIRECTOR';"
    );
    expect(director.rows.length).toBe(1);
    expect(director.rows[0].email).toBe("director@demo.intila9a.local");
    expect(director.rows[0].first_name).toBe("Fethi");
    expect(director.rows[0].last_name).toBe("Omri");

    // Verify Teacher
    const teacher = await pool.query(
      "SELECT email, role FROM users WHERE role = 'TEACHER';"
    );
    expect(teacher.rows.length).toBe(1);

    // Verify Grades 1-6
    const grades = await pool.query("SELECT level FROM grades ORDER BY level ASC;");
    expect(grades.rows.map((r: { level: number }) => r.level)).toEqual([1, 2, 3, 4, 5, 6]);

    // Verify initial Teacher meeting notice
    const initialMeeting = await pool.query(
      "SELECT title, audience FROM posts WHERE audience = 'TEACHERS';"
    );
    expect(initialMeeting.rows.length).toBeGreaterThan(0);
    expect(initialMeeting.rows[0].title).toContain("Conseil pédagogique");
  });

  it("authenticates users and locks out after 5 failed attempts", async () => {
    const pool = await createTestDb();

    // Monkey-patch globalThis.__intila9aPgPool to test users module functions
    const originalPool = globalThis.__intila9aPgPool;
    globalThis.__intila9aPgPool = pool;

    try {
      const user = await dbGetUserByEmail("director@demo.intila9a.local");
      expect(user).not.toBeNull();
      expect(user?.role).toBe("DIRECTOR");

      // Valid Director password (fethi2026)
      const validAuth = await dbVerifyUserPassword("director@demo.intila9a.local", "fethi2026");
      expect(validAuth.user).not.toBeNull();
      expect(validAuth.isLocked).toBe(false);

      // Wrong password attempts
      for (let i = 0; i < 4; i++) {
        const fail = await dbVerifyUserPassword("director@demo.intila9a.local", "wrongpassword");
        expect(fail.user).toBeNull();
        expect(fail.isLocked).toBe(false);
      }

      // 5th failed attempt triggers lock
      const fifthFail = await dbVerifyUserPassword("director@demo.intila9a.local", "wrongpassword");
      expect(fifthFail.user).toBeNull();
      expect(fifthFail.isLocked).toBe(true);

      // Even correct password is now blocked while locked
      const blocked = await dbVerifyUserPassword("director@demo.intila9a.local", "fethi2026");
      expect(blocked.user).toBeNull();
      expect(blocked.isLocked).toBe(true);
    } finally {
      globalThis.__intila9aPgPool = originalPool;
    }
  });

  it("persists posts with PDF attachments and isolates TEACHERS audience", async () => {
    const pool = await createTestDb();
    const originalPool = globalThis.__intila9aPgPool;
    globalThis.__intila9aPgPool = pool;

    try {
      const director = await dbGetUserByEmail("director@demo.intila9a.local");
      expect(director).not.toBeNull();
      const authorId = director ? director.id : "";

      // Create a Director-to-Teacher convocation
      const createdPost = await dbCreatePost({
        authorId,
        authorName: "Fethi Omri (Direction)",
        authorRole: "DIRECTOR",
        subject: "Conseil Pédagogique",
        grade: 0,
        type: "ANNOUNCEMENT",
        audience: "TEACHERS",
        title: "Réunion de coordination du 2e trimestre",
        description: "Examen des résultats et bilans pédagogiques.",
        file: {
          id: "temp-file",
          fileName: "convocation_conseil.pdf",
          mimeType: "application/pdf",
          size: 2048,
          dataBase64: "JVBERi0xLjQK...",
        },
      });

      expect(createdPost.id).toBeDefined();
      expect(createdPost.file?.fileName).toBe("convocation_conseil.pdf");

      // Verify listTeacherPosts includes this post
      const teacherFeed = await dbListTeacherPosts();
      expect(teacherFeed.some((p) => p.id === createdPost.id)).toBe(true);

      // Verify students and parents feeds STRICTLY exclude this post
      const studentFeed = await dbListPostsByGrade(1, "STUDENTS");
      expect(studentFeed.some((p) => p.id === createdPost.id)).toBe(false);

      const parentFeed = await dbListPostsByGrade(1, "PARENTS");
      expect(parentFeed.some((p) => p.id === createdPost.id)).toBe(false);

      // Verify retrieval by ID
      const fetched = await dbGetPostById(createdPost.id);
      expect(fetched?.title).toBe("Réunion de coordination du 2e trimestre");
      expect(fetched?.file?.fileName).toBe("convocation_conseil.pdf");

      // Delete/moderate post
      const deleted = await dbDeletePost(createdPost.id, "Information archivée");
      expect(deleted).toBe(true);

      const postAfterDelete = await dbGetPostById(createdPost.id);
      expect(postAfterDelete?.deletedAt).not.toBeNull();
      expect(postAfterDelete?.deletedReason).toBe("Information archivée");

      // Active teacher feed should no longer list it
      const updatedTeacherFeed = await dbListTeacherPosts();
      expect(updatedTeacherFeed.some((p) => p.id === createdPost.id)).toBe(false);

      // listAllPosts(true) should contain it, listAllPosts(false) should not
      const allActive = await dbListAllPosts(false);
      expect(allActive.some((p) => p.id === createdPost.id)).toBe(false);

      const allWithDeleted = await dbListAllPosts(true);
      expect(allWithDeleted.some((p) => p.id === createdPost.id)).toBe(true);
    } finally {
      globalThis.__intila9aPgPool = originalPool;
    }
  });

  it("transparently routes post-service operations to database when configured", async () => {
    const pool = await createTestDb();
    const originalPool = globalThis.__intila9aPgPool;
    const originalDbUrl = process.env.DATABASE_URL;

    globalThis.__intila9aPgPool = pool;
    process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";

    try {
      const director = await dbGetUserByEmail("director@demo.intila9a.local");
      expect(director).not.toBeNull();
      const serviceAuthorId = director ? director.id : "";

      // Create via post-service
      const servicePost = await createPost({
        authorId: serviceAuthorId,
        authorName: "Fethi Omri (Directeur)",
        authorRole: "DIRECTOR",
        subject: "Directives administratives",
        grade: 0,
        type: "ANNOUNCEMENT",
        audience: "TEACHERS",
        title: "Consignes de sécurité et surveillance",
        description: "Rappel des consignes de surveillance de la cour de récréation.",
      });

      expect(servicePost.id).toBeDefined();

      // List teacher announcements via post-service
      const teacherAnnouncements = await listTeacherAnnouncements();
      expect(teacherAnnouncements.some((p) => p.id === servicePost.id)).toBe(true);

      // Verify student feed excludes it
      const studentFeed = await listPostsByGrade(2, "STUDENTS");
      expect(studentFeed.some((p) => p.id === servicePost.id)).toBe(false);

      // Get by id via post-service
      const found = await getPostById(servicePost.id);
      expect(found?.title).toBe("Consignes de sécurité et surveillance");

      // Delete via post-service
      const deleted = await deletePost(servicePost.id, "Mis à jour");
      expect(deleted).toBe(true);

      const afterDelete = await getPostById(servicePost.id);
      expect(afterDelete?.deletedAt).not.toBeNull();

      const allActive = await listAllPosts(false);
      expect(allActive.some((p) => p.id === servicePost.id)).toBe(false);
    } finally {
      globalThis.__intila9aPgPool = originalPool;
      process.env.DATABASE_URL = originalDbUrl;
    }
  });
});
