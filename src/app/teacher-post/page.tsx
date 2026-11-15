import { LogOut } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { LogoutButton } from "@/features/auth/components/logout-button";
import { TeacherPostForm } from "@/features/posts/teacher-post-form";
import { getCurrentSession, getDemoSession } from "@/server/auth/session-service";
import { canCreatePosts } from "@/server/authorization/policy";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Publier pour une classe",
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

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-5 py-8 sm:px-8 lg:py-12">
      <header className="mb-8 flex flex-col gap-4 border-b border-[var(--line)] pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#47758b]">{roleTitle}</p>
          <p className="mt-1 text-sm text-[var(--muted)]">Connecté en tant que {session.principal.firstName} {session.principal.lastName}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#c7d3df] bg-white px-4 text-sm font-bold text-[var(--ink)] transition hover:border-[#8ca2b5]" href="/"><LogOut aria-hidden="true" size={17} />Changer d’espace</Link>
          <LogoutButton />
        </div>
      </header>
      <TeacherPostForm
        defaultAuthorName={`${session.principal.firstName} ${session.principal.lastName}`}
        sessionToken={urlToken}
      />
      <p className="mt-6 text-center text-xs leading-5 text-[var(--muted)]">Les publications ajoutées dans cet aperçu sont conservées uniquement tant que le serveur local reste actif.</p>
    </main>
  );
}
