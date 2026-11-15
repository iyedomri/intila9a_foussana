import { BookOpenCheck, Globe2, HeartHandshake, LockKeyhole } from "lucide-react";
import type { ReactNode } from "react";

import { LoginForm } from "@/features/auth/components/login-form";

export const metadata = {
  title: "Connexion",
};

export default function LoginPage(): ReactNode {
  return (
    <main className="mx-auto grid min-h-screen max-w-7xl items-center gap-10 px-5 py-10 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(28rem,36rem)] lg:px-12">
      <section className="order-2 lg:order-1">
        <div className="mb-8 flex items-center gap-3">
          <div className="grid size-12 place-items-center rounded-2xl bg-[var(--brand)] text-white shadow-[0_10px_24px_rgba(20,108,148,0.28)]">
            <BookOpenCheck aria-hidden="true" size={25} strokeWidth={2.4} />
          </div>
          <span className="text-lg font-extrabold tracking-tight text-[var(--ink)]">Intila9a Foussana</span>
        </div>

        <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#47758b]">Portail scolaire privé</p>
        <h1 className="mt-4 max-w-xl text-4xl font-extrabold tracking-[-0.04em] text-[var(--ink)] sm:text-5xl">
          Chaque apprentissage,
          <span className="text-[var(--brand)]"> en toute confiance.</span>
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-8 text-[var(--muted)]">
          Un espace clair et sécurisé pour les élèves, leurs familles, les enseignants et la direction.
        </p>

        <dl className="mt-10 grid max-w-2xl gap-4 sm:grid-cols-3">
          <InfoItem icon={<LockKeyhole aria-hidden="true" size={20} />} label="Accès protégé" text="Vos données restent privées." />
          <InfoItem icon={<HeartHandshake aria-hidden="true" size={20} />} label="Pour les familles" text="Pensé pour le mobile." />
          <InfoItem icon={<Globe2 aria-hidden="true" size={20} />} label="Multilingue" text="Français, العربية, English." />
        </dl>
      </section>

      <section className="order-1 w-full lg:order-2">
        <LoginForm />
      </section>
    </main>
  );
}

function InfoItem({
  icon,
  label,
  text,
}: Readonly<{ icon: ReactNode; label: string; text: string }>): ReactNode {
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-white/70 p-4">
      <div className="text-[var(--brand)]">{icon}</div>
      <dt className="mt-3 text-sm font-bold text-[var(--ink)]">{label}</dt>
      <dd className="mt-1 text-sm leading-5 text-[var(--muted)]">{text}</dd>
    </div>
  );
}
