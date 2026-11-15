import "server-only";

import { randomUUID } from "node:crypto";

import type { UserRole } from "@/server/auth/types";

export const DEMO_POST_TYPES = ["EXERCISE", "EXAM", "LESSON_NOTE"] as const;

export type DemoPostType = (typeof DEMO_POST_TYPES)[number];

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
  readonly grade: number;
  readonly title: string;
  readonly description: string;
  readonly type: DemoPostType;
  readonly file?: DemoPostFile;
  readonly createdAt: Date;
}

interface DemoPostState {
  readonly posts: DemoPost[];
}

declare global {
  // eslint-disable-next-line no-var
  var __intila9aDemoPostState: DemoPostState | undefined;
}

function getState(): DemoPostState {
  if (!globalThis.__intila9aDemoPostState) {
    globalThis.__intila9aDemoPostState = { posts: [] };
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
  return createdPost;
}

export function listDemoPostsByGrade(grade: number): readonly DemoPost[] {
  return getState().posts.filter((post) => post.grade === grade);
}

export function getDemoPostById(id: string): DemoPost | undefined {
  return getState().posts.find((post) => post.id === id);
}
