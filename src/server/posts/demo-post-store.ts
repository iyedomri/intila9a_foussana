import "server-only";

import { randomUUID } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import type { UserRole } from "@/server/auth/types";

export const DEMO_POST_TYPES = [
  "EXERCISE",
  "EXAM",
  "LESSON_NOTE",
  "ANNOUNCEMENT",
] as const;

export type DemoPostType = (typeof DEMO_POST_TYPES)[number];

export const DEMO_AUDIENCES = ["ALL", "STUDENTS", "PARENTS", "TEACHERS"] as const;

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

const DEFAULT_INITIAL_POSTS: DemoPost[] = [
  {
    id: "initial-director-meeting",
    authorId: "director-fethi-omri",
    authorName: "Fethi Omri (Direction)",
    authorRole: "DIRECTOR",
    subject: "Conseil pédagogique & Coordination",
    grade: 0,
    title: "Convocation : Conseil pédagogique et organisation du 1er trimestre",
    description:
      "Chers collègues enseignants,\n\nVous êtes priés d'assister à la réunion pédagogique trimestrielle ce jeudi à 14h00 en salle des professeurs.\n\nOrdre du jour :\n1. Calendrier des devoirs de contrôle et de synthèse du 1er trimestre.\n2. Suivi des projets pédagogiques et soutien scolaire.\n3. Organisation des activités parascolaires et vie de l'établissement.\n\nLa présence de l'ensemble du corps enseignant est indispensable. Merci pour votre engagement continu.",
    type: "ANNOUNCEMENT",
    audience: "TEACHERS",
    createdAt: new Date("2026-11-14T09:00:00.000Z"),
  },
];

function getState(): DemoPostState {
  if (!globalThis.__intila9aDemoPostState) {
    const diskPosts = loadFromDisk();
    const initialPosts = diskPosts.length > 0 ? diskPosts : [...DEFAULT_INITIAL_POSTS];
    globalThis.__intila9aDemoPostState = { posts: initialPosts };
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

    // Students must not see staff-only or parent-only posts
    if (isStudent && (post.audience === "PARENTS" || post.audience === "TEACHERS")) {
      return false;
    }

    // Parents must not see student-only or staff-only posts
    if (isParent && (post.audience === "STUDENTS" || post.audience === "TEACHERS")) {
      return false;
    }

    return true;
  });
}

export function listTeacherPosts(): readonly DemoPost[] {
  return getState().posts.filter((post) => {
    if (post.deletedAt) {
      return false;
    }
    // Explicitly targeted to teachers, or general announcement from the Director
    const isTargetedToTeachers = post.audience === "TEACHERS";
    const isDirectorBroadcast =
      post.authorRole === "DIRECTOR" && (post.audience === "ALL" || post.type === "ANNOUNCEMENT");

    return isTargetedToTeachers || isDirectorBroadcast;
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
