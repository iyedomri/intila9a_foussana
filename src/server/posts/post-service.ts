import "server-only";

import {
  dbCreatePost,
  dbDeletePost,
  dbGetPostById,
  dbListAllPosts,
  dbListPostsByGrade,
  dbListTeacherPosts,
} from "@/server/db/posts";
import { isDatabaseConfigured } from "@/server/db/pool";
import { ensureDatabaseSchema } from "@/server/db/init";
import {
  createDemoPost,
  deleteDemoPost,
  getDemoPostById,
  listAllDemoPosts,
  listDemoPostsByGrade,
  listTeacherPosts,
  type DemoPost,
  type DemoPostAudience,
} from "@/server/posts/demo-post-store";

let schemaReady = false;

async function checkSchema(): Promise<void> {
  if (isDatabaseConfigured() && !schemaReady) {
    schemaReady = await ensureDatabaseSchema();
  }
}

export async function createPost(
  post: Omit<DemoPost, "id" | "createdAt">,
): Promise<DemoPost> {
  if (isDatabaseConfigured()) {
    await checkSchema();
    try {
      return await dbCreatePost(post);
    } catch (err) {
      console.error("[Post Service DB Error - Falling back to demo store]", err);
    }
  }

  return createDemoPost(post);
}

export async function listPostsByGrade(
  grade: number,
  audience?: DemoPostAudience | "Élève" | "Parent",
): Promise<readonly DemoPost[]> {
  if (isDatabaseConfigured()) {
    await checkSchema();
    try {
      return await dbListPostsByGrade(grade, audience);
    } catch (err) {
      console.error("[Post Service DB Error - Falling back to demo store]", err);
    }
  }

  return listDemoPostsByGrade(grade, audience);
}

export async function listTeacherAnnouncements(): Promise<readonly DemoPost[]> {
  if (isDatabaseConfigured()) {
    await checkSchema();
    try {
      return await dbListTeacherPosts();
    } catch (err) {
      console.error("[Post Service DB Error - Falling back to demo store]", err);
    }
  }

  return listTeacherPosts();
}

export async function listAllPosts(includeDeleted = false): Promise<readonly DemoPost[]> {
  if (isDatabaseConfigured()) {
    await checkSchema();
    try {
      return await dbListAllPosts(includeDeleted);
    } catch (err) {
      console.error("[Post Service DB Error - Falling back to demo store]", err);
    }
  }

  return listAllDemoPosts(includeDeleted);
}

export async function deletePost(id: string, reason?: string, deletedById?: string): Promise<boolean> {
  if (isDatabaseConfigured()) {
    await checkSchema();
    try {
      return await dbDeletePost(id, reason, deletedById);
    } catch (err) {
      console.error("[Post Service DB Error - Falling back to demo store]", err);
    }
  }

  return deleteDemoPost(id, reason);
}

export async function getPostById(id: string): Promise<DemoPost | undefined> {
  if (isDatabaseConfigured()) {
    await checkSchema();
    try {
      return await dbGetPostById(id);
    } catch (err) {
      console.error("[Post Service DB Error - Falling back to demo store]", err);
    }
  }

  return getDemoPostById(id);
}
