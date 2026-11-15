import { ArrowUpRight, Bell, CalendarDays, ClipboardList, ShieldCheck, UserRound } from "lucide-react";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { LogoutButton } from "@/features/auth/components/logout-button";
import { getCurrentSession } from "@/server/auth/session-service";
import type { UserRole } from "@/server/auth/types";

export const metadata = {
  title: "Tableau de bord",
};

export const dynamic = "force-dynamic";

const roleCopy: Record<UserRole, { title: string; summary: string; actions: readonly string[] }> = {
  DIRECTOR: {
    title: "Espace Direction",
    summary: "Vous pouvez gérer les comptes, les affectations, les événements et la modération.",
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

export default async function DashboardPage(): Promise<ReactNode> {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
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
            <p className="text-xs text-[var(--muted)]">Aperçu local sécurisé</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-bold text-[var(--ink)]">{session.principal.firstName} {session.principal.lastName}</p>
            <p className="text-xs text-[var(--muted)]">{roleLabel(session.principal.role)}</p>
          </div>
          <LogoutButton />
        </div>
      </header>

      <div className="mt-6 rounded-2xl border border-[#f0d899] bg-[#fff9e9] px-4 py-3 text-sm leading-6 text-[#735517]" role="status">
        <strong>Aperçu de développement :</strong> l’authentification, les cookies sécurisés, la protection CSRF et les rôles sont testables ici. Les contenus persistants seront activés après l’intégration PostgreSQL/Prisma.
      </div>

      <section className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#47758b]">{roleLabel(session.principal.role)}</p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-[-0.035em] text-[var(--ink)] sm:text-4xl">{copy.title}</h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-[var(--muted)]">{copy.summary}</p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
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
        </div>

        <aside className="rounded-3xl bg-[var(--ink)] p-6 text-white shadow-[0_20px_50px_rgba(18,36,58,0.18)]">
          <UserRound aria-hidden="true" className="text-[#8ed4e5]" size={24} />
          <h2 className="mt-6 text-xl font-bold">Votre session</h2>
          <dl className="mt-5 space-y-4 text-sm">
            <div>
              <dt className="text-[#b8c7d8]">Compte</dt>
              <dd className="mt-1 break-all font-semibold">{session.principal.email}</dd>
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
