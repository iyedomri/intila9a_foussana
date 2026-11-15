import { LogOut } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { LogoutButton } from "@/features/auth/components/logout-button";
import {
  TeacherSpace,
  type SerializedTeacherPost,
} from "@/features/posts/teacher-space";
import { getCurrentSession, getDemoSession } from "@/server/auth/session-service";
import { canCreatePosts } from "@/server/authorization/policy";
import { listTeacherPosts } from "@/server/posts/demo-post-store";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Espace Enseignant — Convocations & Publications",
};

export default async function TeacherPostPage({
  searchParams,
}: {
  searchParams?: Promise<{ auth?: string }>;
}): Promise<ReactNode> {
  const sp = searchParams ? await searchParams : undefined;
  const urlToken = sp?.auth;

  const session =
    (urlToken ? getDemoSession(urlToken) : null) ??
    (await getCurrentSession("TEACHER")) ??
    (await getCurrentSession("DIRECTOR"));

  if (!session || !canCreatePosts(session.principal)) {
    redirect("/teacher-access");
  }

  const roleTitle =
    session.principal.role === "DIRECTOR"
      ? "Espace Direction"
      : "Espace enseignant";

  const rawPosts = listTeacherPosts();
  const initialPosts: readonly SerializedTeacherPost[] = rawPosts.map((post) => ({
    id: post.id,
    authorName: post.authorName,
    authorRole: post.authorRole,
    subject: post.subject,
    grade: post.grade,
    title: post.title,
    description: post.description,
    type: post.type,
    audience: post.audience,
    hasFile: Boolean(post.file),
    fileName: post.file?.fileName,
    fileSize: post.file?.size,
    createdAt: post.createdAt.toISOString(),
  }));

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-5 py-8 sm:px-8 lg:py-12">
      <header className="mb-8 flex flex-col gap-4 border-b border-[var(--line)] pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#47758b]">
            {roleTitle}
          </p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Connecté en tant que {session.principal.firstName} {session.principal.lastName}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {session.principal.role === "DIRECTOR" ? (
            <Link
              className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#c7d3df] bg-white px-4 text-sm font-bold text-[var(--ink)] transition hover:border-[#8ca2b5]"
              href={urlToken ? `/dashboard?auth=${encodeURIComponent(urlToken)}` : "/dashboard"}
            >
              Tableau de bord
            </Link>
          ) : null}
          <Link
            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#c7d3df] bg-white px-4 text-sm font-bold text-[var(--ink)] transition hover:border-[#8ca2b5]"
            href="/"
          >
            <LogOut aria-hidden="true" size={17} />
            Changer d’espace
          </Link>
          <LogoutButton />
        </div>
      </header>

      <TeacherSpace
        currentUserName={`${session.principal.firstName} ${session.principal.lastName}`}
        initialPosts={initialPosts}
        isDirector={session.principal.role === "DIRECTOR"}
        sessionToken={urlToken}
      />

      <p className="mt-8 text-center text-xs leading-5 text-[var(--muted)]">
        Portail de communication interne et pédagogique — École Primaire Intila9a Foussana
      </p>
    </main>
  );
}
