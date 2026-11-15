import "server-only";

import { randomUUID } from "node:crypto";

import type { UserRole } from "@/server/auth/types";

export const DEMO_POST_TYPES = [
  "EXERCISE",
  "EXAM",
  "LESSON_NOTE",
  "ANNOUNCEMENT",
] as const;

export type DemoPostType = (typeof DEMO_POST_TYPES)[number];

export const DEMO_AUDIENCES = ["ALL", "STUDENTS", "PARENTS"] as const;

export type DemoPostAudience = (typeof DEMO_AUDIENCES)[number];

export interface DemoPostFile {
  readonly id: string;
  readonly fileName: string;
  readonly mimeType: string;
  readonly size: number;
  readonly dataBase64: string;
}

export interface DemoPost {
  readonly id: string;
  readonly authorId: string;
  readonly authorName: string;
  readonly authorRole: UserRole;
  readonly subject: string;
  readonly grade: number; // 0 = Toute l'école, 1..6 = Année spécifique
  readonly title: string;
  readonly description: string;
  readonly type: DemoPostType;
  readonly audience?: DemoPostAudience;
  readonly file?: DemoPostFile;
  deletedAt?: Date | null;
  deletedReason?: string | null;
  readonly createdAt: Date;
}

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

interface DemoPostState {
  readonly posts: DemoPost[];
}

declare global {
  // eslint-disable-next-line no-var
  var __intila9aDemoPostState: DemoPostState | undefined;
}

const BACKUP_FILE = join(tmpdir(), "intila9a_posts_backup.json");

function persistToDisk(posts: readonly DemoPost[]): void {
  try {
    writeFileSync(BACKUP_FILE, JSON.stringify(posts), "utf8");
  } catch {
    // Ignore storage issues in restricted environments
  }
}

function loadFromDisk(): DemoPost[] {
  try {
    if (existsSync(BACKUP_FILE)) {
      const raw = readFileSync(BACKUP_FILE, "utf8");
      const parsed = JSON.parse(raw) as DemoPost[];
      return parsed.map((p) => ({
        ...p,
        createdAt: new Date(p.createdAt),
        deletedAt: p.deletedAt ? new Date(p.deletedAt) : null,
      }));
    }
  } catch {
    // Ignore read errors
  }
  return [];
}

function getState(): DemoPostState {
  if (!globalThis.__intila9aDemoPostState) {
    const diskPosts = loadFromDisk();
    globalThis.__intila9aDemoPostState = { posts: diskPosts };
  }

  return globalThis.__intila9aDemoPostState;
}

export function createDemoPost(
  post: Omit<DemoPost, "id" | "createdAt">,
): DemoPost {
  const createdPost: DemoPost = {
    ...post,
    id: randomUUID(),
    createdAt: new Date(),
  };

  getState().posts.unshift(createdPost);
  persistToDisk(getState().posts);
  return createdPost;
}

export function listDemoPostsByGrade(
  grade: number,
  audience?: DemoPostAudience | "Élève" | "Parent",
): readonly DemoPost[] {
  return getState().posts.filter((post) => {
    if (post.deletedAt) {
      return false;
    }
    const matchesGrade = post.grade === 0 || post.grade === grade;
    if (!matchesGrade) {
      return false;
    }
    const isStudent = audience === "Élève" || audience === "STUDENTS";
    const isParent = audience === "Parent" || audience === "PARENTS";
    if (isStudent && post.audience === "PARENTS") {
      return false;
    }
    if (isParent && post.audience === "STUDENTS") {
      return false;
    }
    return true;
  });
}

export function listAllDemoPosts(includeDeleted = false): readonly DemoPost[] {
  return includeDeleted
    ? [...getState().posts]
    : getState().posts.filter((post) => !post.deletedAt);
}

export function deleteDemoPost(id: string, reason?: string): boolean {
  const post = getState().posts.find((candidate) => candidate.id === id);
  if (!post) {
    return false;
  }
  post.deletedAt = new Date();
  post.deletedReason = reason || "Supprimé par la Direction";
  persistToDisk(getState().posts);
  return true;
}

export function getDemoPostById(id: string): DemoPost | undefined {
  return getState().posts.find((post) => post.id === id);
}
