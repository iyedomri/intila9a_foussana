import { BookOpenCheck, GraduationCap, ShieldCheck, UsersRound } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

export const metadata = {
  title: "Choisir un espace",
};

export default function HomePage(): ReactNode {
  return (
    <main className="mx-auto grid min-h-screen max-w-6xl place-items-center px-5 py-10 sm:px-8">
      <section className="w-full">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-[var(--brand)] text-white shadow-[0_14px_28px_rgba(20,108,148,0.26)]">
            <BookOpenCheck aria-hidden="true" size={29} strokeWidth={2.4} />
          </div>
          <p className="mt-7 text-sm font-bold uppercase tracking-[0.16em] text-[#47758b]">Intila9a Foussana</p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-[-0.04em] text-[var(--ink)] sm:text-5xl">Choisissez votre espace</h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-[var(--muted)] sm:text-lg">
            Un portail conçu pour l’apprentissage, les familles et l’équipe éducative.
          </p>
        </div>

        <div className="mx-auto mt-10 grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <AccessCard
            description="Consulter le guide de démonstration et télécharger les documents publics."
            href="/student-space"
            icon={<GraduationCap aria-hidden="true" size={25} />}
            label="Je suis élève"
            tone="sky"
          />
          <AccessCard
            description="Accéder à l’aperçu de consultation réservé aux familles."
            href="/parent-space"
            icon={<UsersRound aria-hidden="true" size={25} />}
            label="Je suis parent"
            tone="mint"
          />
          <AccessCard
            description="Accéder à l’espace professionnel avec un mot de passe enseignant."
            href="/teacher-access"
            icon={<BookOpenCheck aria-hidden="true" size={25} />}
            label="Je suis enseignant"
            tone="gold"
          />
          <AccessCard
            description="Gérer l’établissement avec le mot de passe Direction."
            href="/director-access"
            icon={<ShieldCheck aria-hidden="true" size={25} />}
            label="Je suis Direction"
            tone="navy"
          />
        </div>

        <p className="mx-auto mt-8 max-w-3xl text-center text-sm leading-6 text-[var(--muted)]">
          Les espaces élève et parent sont en lecture seule. Dans la version publiée, les contenus de classe et les téléchargements privés restent liés à l’élève ou à l’enfant autorisé.
        </p>
      </section>
    </main>
  );
}

function AccessCard({
  description,
  href,
  icon,
  label,
  tone,
}: Readonly<{
  description: string;
  href: string;
  icon: ReactNode;
  label: string;
  tone: "sky" | "mint" | "gold" | "navy";
}>): ReactNode {
  const toneClass = {
    sky: "bg-[#e5f5fa] text-[#176e91] hover:border-[#80c8db]",
    mint: "bg-[#e9f7ef] text-[#287255] hover:border-[#91cfad]",
    gold: "bg-[#fff7e7] text-[#9a6713] hover:border-[#e8bf70]",
    navy: "bg-[#e9eef8] text-[#314e79] hover:border-[#9fb4d8]",
  }[tone];

  return (
    <Link
      className={`group min-h-60 rounded-3xl border border-transparent p-6 shadow-[0_12px_35px_rgba(31,68,100,0.08)] transition hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(31,68,100,0.14)] ${toneClass}`}
      href={href}
    >
      <span className="grid size-12 place-items-center rounded-2xl bg-white/80 shadow-sm">{icon}</span>
      <span className="mt-10 block text-lg font-extrabold tracking-tight">{label}</span>
      <span className="mt-3 block text-sm leading-6 text-[#52677e]">{description}</span>
      <span className="mt-5 inline-flex text-sm font-bold underline-offset-4 group-hover:underline">Entrer dans l’espace</span>
    </Link>
  );
}
