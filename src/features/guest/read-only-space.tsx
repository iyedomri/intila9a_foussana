import { ArrowLeft, Download, FileText, LockKeyhole, Sparkles } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

export function ReadOnlySpace({ audience }: Readonly<{ audience: "Élève" | "Parent" }>): ReactNode {
  return (
    <main className="mx-auto min-h-screen max-w-5xl px-5 py-8 sm:px-8 lg:py-12">
      <Link className="inline-flex items-center gap-2 text-sm font-bold text-[var(--brand)] underline-offset-4 hover:underline" href="/">
        <ArrowLeft aria-hidden="true" size={18} />
        Choisir un autre espace
      </Link>

      <section className="mt-8 rounded-[2rem] border border-[#cde6ee] bg-gradient-to-br from-[#edf9fc] to-white p-6 shadow-[0_18px_45px_rgba(31,68,100,0.08)] sm:p-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.15em] text-[#39758a]">Espace {audience}</p>
            <h1 className="mt-3 text-3xl font-extrabold tracking-[-0.035em] text-[var(--ink)]">Consultation en lecture seule</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--muted)]">
              Vous pouvez consulter les informations proposées dans cet aperçu et télécharger le document de démonstration. Vous ne pouvez ni publier, ni modifier, ni commenter.
            </p>
          </div>
          <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-white text-[var(--brand)] shadow-sm">
            <Sparkles aria-hidden="true" size={26} />
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <article className="rounded-3xl border border-[var(--line)] bg-white p-6 shadow-[0_10px_30px_rgba(31,68,100,0.06)] sm:p-8">
          <div className="flex items-start gap-4">
            <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#e8f5f8] text-[var(--brand)]"><FileText aria-hidden="true" size={23} /></div>
            <div>
              <p className="text-sm font-bold text-[var(--ink)]">Guide de découverte</p>
              <p className="mt-1 text-sm leading-6 text-[var(--muted)]">Document non personnel disponible pour vérifier le téléchargement dans cette préversion.</p>
            </div>
          </div>
          <a className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[var(--brand)] px-4 text-sm font-bold text-white transition hover:bg-[var(--brand-strong)]" download href="/read-only-guide.txt">
            <Download aria-hidden="true" size={18} />
            Télécharger le guide
          </a>
        </article>

        <aside className="rounded-3xl bg-[var(--ink)] p-6 text-white">
          <LockKeyhole aria-hidden="true" className="text-[#8ed4e5]" size={24} />
          <h2 className="mt-5 text-lg font-bold">Protection des contenus</h2>
          <p className="mt-3 text-sm leading-6 text-[#c6d5e2]">
            Les futurs devoirs, examens et fichiers de classe ne seront jamais affichés dans cet aperçu public. Ils nécessitent toujours une autorisation liée à la classe ou à l’enfant concerné.
          </p>
        </aside>
      </section>
    </main>
  );
}
