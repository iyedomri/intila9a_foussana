import { ArrowUpRight, Bell, CalendarDays, ClipboardList, PlusCircle, ShieldCheck, UserRound } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { LogoutButton } from "@/features/auth/components/logout-button";
import { DirectorDashboard } from "@/features/dashboard/director-dashboard";
import { getCurrentSession, getDemoSession } from "@/server/auth/session-service";
import type { UserRole } from "@/server/auth/types";

export const metadata = {
  title: "Tableau de bord - Direction",
};

export const dynamic = "force-dynamic";

const roleCopy: Record<UserRole, { title: string; summary: string; actions: readonly string[] }> = {
  DIRECTOR: {
    title: "Espace Direction & Modération",
    summary: "Gérez les annonces officielles pour toute l’école ou par classe, publiez avec documents joints et modérez l'ensemble des publications.",
    actions: ["Gestion des utilisateurs", "Modération des contenus", "Journal d’audit"],
  },
  TEACHER: {
    title: "Espace Enseignant",
    summary: "Vos publications seront toujours limitées à vos classes et matières affectées.",
    actions: ["Créer une publication", "Voir mes publications", "Événements enseignants"],
  },
  STUDENT: {
    title: "Espace Élève",
    summary: "Vous verrez uniquement les leçons, exercices et examens de votre classe.",
    actions: ["Mon fil de classe", "Calendrier des examens", "Notifications"],
  },
  PARENT: {
    title: "Espace Parent",
    summary: "Vous pourrez choisir un enfant lié pour consulter ses contenus de classe.",
    actions: ["Choisir un enfant", "Fil d’apprentissage", "Calendrier scolaire"],
  },
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ auth?: string }>;
}): Promise<ReactNode> {
  const sp = searchParams ? await searchParams : undefined;
  const urlToken = sp?.auth;

  const session =
    (urlToken ? getDemoSession(urlToken) : null) ??
    (await getCurrentSession("DIRECTOR")) ??
    (await getCurrentSession("TEACHER"));

  if (!session) {
    redirect("/director-access");
  }

  if (session.principal.mustChangePassword) {
    redirect("/change-password");
  }

  const copy = roleCopy[session.principal.role];

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-5 py-6 sm:px-8 lg:px-12 lg:py-10">
      <header className="flex flex-col gap-5 border-b border-[var(--line)] pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-2xl bg-[var(--brand)] text-white shadow-sm">
            <ShieldCheck aria-hidden="true" size={23} />
          </div>
          <div>
            <p className="text-sm font-extrabold tracking-tight text-[var(--ink)]">Intila9a Foussana</p>
            <p className="text-xs text-[var(--muted)]">Espace Direction & Supervision</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-bold text-[var(--ink)]">{session.principal.firstName} {session.principal.lastName}</p>
            <p className="text-xs text-[var(--muted)]">{roleLabel(session.principal.role)}</p>
          </div>
          {session.principal.role === "TEACHER" || session.principal.role === "DIRECTOR" ? (
            <Link
              className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[var(--brand)] px-4 text-sm font-bold text-white shadow-sm transition hover:bg-[var(--brand-strong)]"
              href={urlToken ? `/teacher-post?auth=${encodeURIComponent(urlToken)}` : "/teacher-post"}
            >
              <PlusCircle aria-hidden="true" size={17} />
              Publier pour une classe
            </Link>
          ) : null}
          <LogoutButton />
        </div>
      </header>

      <section className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="space-y-6">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#47758b]">{roleLabel(session.principal.role)}</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.035em] text-[var(--ink)] sm:text-4xl">{copy.title}</h1>
            <p className="mt-2 max-w-3xl text-base leading-7 text-[var(--muted)]">{copy.summary}</p>
          </div>

          {session.principal.role === "DIRECTOR" ? (
            <DirectorDashboard principal={session.principal} sessionToken={urlToken} />
          ) : (
            <div className="grid gap-4 sm:grid-cols-3">
              {copy.actions.map((action, index) => (
                <button
                  className="group rounded-2xl border border-[var(--line)] bg-white p-5 text-left shadow-[0_8px_30px_rgba(31,68,100,0.06)] transition hover:-translate-y-0.5 hover:border-[#92c5d4] hover:shadow-[0_14px_34px_rgba(31,68,100,0.12)]"
                  key={action}
                  type="button"
                >
                  <div className="grid size-10 place-items-center rounded-xl bg-[#e7f5f8] text-[var(--brand)]">
                    {index === 0 ? <ClipboardList aria-hidden="true" size={20} /> : index === 1 ? <CalendarDays aria-hidden="true" size={20} /> : <Bell aria-hidden="true" size={20} />}
                  </div>
                  <span className="mt-5 flex items-center justify-between gap-3 text-sm font-bold text-[var(--ink)]">
                    {action}
                    <ArrowUpRight aria-hidden="true" className="text-[var(--brand)]" size={18} />
                  </span>
                  <span className="mt-2 block text-sm leading-5 text-[var(--muted)]">Bientôt disponible dans la suite sécurisée.</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <aside className="h-fit space-y-6">
          <div className="rounded-3xl bg-[var(--ink)] p-6 text-white shadow-[0_20px_50px_rgba(18,36,58,0.18)]">
            <UserRound aria-hidden="true" className="text-[#8ed4e5]" size={24} />
            <h2 className="mt-4 text-xl font-bold">Votre session</h2>
            <dl className="mt-5 space-y-4 text-sm">
              <div>
                <dt className="text-[#b8c7d8]">Compte</dt>
                <dd className="mt-1 break-all font-semibold">{session.principal.email}</dd>
              </div>
              <div>
                <dt className="text-[#b8c7d8]">Rôle de sécurité</dt>
                <dd className="mt-1 font-semibold">{roleLabel(session.principal.role)}</dd>
              </div>
              <div>
                <dt className="text-[#b8c7d8]">Expiration</dt>
                <dd className="mt-1 font-semibold">{session.expiresAt.toLocaleTimeString("fr-TN", { hour: "2-digit", minute: "2-digit" })}</dd>
              </div>
              <div>
                <dt className="text-[#b8c7d8]">Inactivité</dt>
                <dd className="mt-1 font-semibold">30 minutes</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-2xl border border-[#cde6ee] bg-[#f0f9fb] p-5 text-xs text-[#20556b] leading-relaxed">
            <p className="font-bold text-sm text-[var(--ink)] mb-1">Règles de modération</p>
            En tant que Direction, vous supervisez toutes les publications des enseignants et les annonces scolaires. La suppression archive le contenu tout en préservant le journal d'audit.
          </div>
        </aside>
      </section>
    </main>
  );
}

function roleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    DIRECTOR: "Direction",
    TEACHER: "Enseignant",
    STUDENT: "Élève",
    PARENT: "Parent",
  };

  return labels[role];
}
