import { ArrowLeft, ChevronRight, Download, FileText, LockKeyhole, NotebookTabs } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { listDemoPostsByGrade, type DemoPostType } from "@/server/posts/demo-post-store";

export type ReadOnlyAudience = "Élève" | "Parent";

const grades = [1, 2, 3, 4, 5, 6] as const;

type GradeLevel = (typeof grades)[number];

interface PreviewPost {
  readonly id?: string;
  readonly subject: string;
  readonly title: string;
  readonly type: "EXERCICE" | "EXAMEN" | "LEÇON";
  readonly due: string;
  readonly authorName?: string;
  readonly description?: string;
  readonly file?: {
    readonly fileName: string;
    readonly size: number;
    readonly downloadUrl: string;
  };
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

const gradePreviewPosts: Record<GradeLevel, readonly PreviewPost[]> = {
  1: [
    { subject: "Français", title: "Les sons et les syllabes", type: "EXERCICE", due: "À revoir cette semaine" },
    { subject: "Mathématiques", title: "Compter jusqu’à 20", type: "LEÇON", due: "Disponible maintenant" },
  ],
  2: [
    { subject: "Mathématiques", title: "Addition et soustraction", type: "EXERCICE", due: "À remettre vendredi" },
    { subject: "Français", title: "Compréhension de texte", type: "LEÇON", due: "Disponible maintenant" },
  ],
  3: [
    { subject: "Sciences", title: "Les états de l’eau", type: "LEÇON", due: "Disponible maintenant" },
    { subject: "Mathématiques", title: "Tables de multiplication", type: "EXAMEN", due: "Calendrier à confirmer" },
  ],
  4: [
    { subject: "Français", title: "Le groupe nominal", type: "EXERCICE", due: "À remettre mardi" },
    { subject: "Sciences", title: "Le système solaire", type: "LEÇON", due: "Disponible maintenant" },
  ],
  5: [
    { subject: "Mathématiques", title: "Fractions et mesures", type: "EXERCICE", due: "À remettre jeudi" },
    { subject: "Histoire", title: "La Tunisie antique", type: "LEÇON", due: "Disponible maintenant" },
  ],
  6: [
    { subject: "Français", title: "Production écrite", type: "EXAMEN", due: "Calendrier à confirmer" },
    { subject: "Sciences", title: "Le corps humain", type: "LEÇON", due: "Disponible maintenant" },
  ],
};

export function isGradeLevel(value: string): value is `${GradeLevel}` {
  return grades.some((grade) => String(grade) === value);
}

function displayPostType(type: DemoPostType): PreviewPost["type"] {
  const labels: Record<DemoPostType, PreviewPost["type"]> = {
    EXERCISE: "EXERCICE",
    EXAM: "EXAMEN",
    LESSON_NOTE: "LEÇON",
  };

  return labels[type];
}

export function ReadOnlyGradePicker({ audience }: Readonly<{ audience: ReadOnlyAudience }>): ReactNode {
  const prefix = audience === "Élève" ? "student-space" : "parent-space";

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-5 py-8 sm:px-8 lg:py-12">
      <Link className="inline-flex items-center gap-2 text-sm font-bold text-[var(--brand)] underline-offset-4 hover:underline" href="/">
        <ArrowLeft aria-hidden="true" size={18} />
        Choisir un autre espace
      </Link>

      <section className="mt-8 rounded-[2rem] border border-[#cde6ee] bg-gradient-to-br from-[#edf9fc] to-white p-6 shadow-[0_18px_45px_rgba(31,68,100,0.08)] sm:p-10">
        <p className="text-sm font-bold uppercase tracking-[0.15em] text-[#39758a]">Espace {audience}</p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-[-0.035em] text-[var(--ink)]">Choisissez votre niveau</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--muted)]">
          Consultez les exercices, leçons et examens de démonstration pour une classe. Cet espace est uniquement en lecture et téléchargement.
        </p>
      </section>

      <section aria-label="Niveaux scolaires" className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {grades.map((grade) => (
          <Link
            className="group flex min-h-36 items-center justify-between rounded-3xl border border-[var(--line)] bg-white p-6 shadow-[0_10px_30px_rgba(31,68,100,0.06)] transition hover:-translate-y-0.5 hover:border-[#8dc6d5] hover:shadow-[0_16px_36px_rgba(31,68,100,0.12)]"
            href={`/${prefix}/grade/${grade}`}
            key={grade}
          >
            <span>
              <span className="grid size-11 place-items-center rounded-2xl bg-[#e8f5f8] text-lg font-extrabold text-[var(--brand)]">{grade}</span>
              <span className="mt-3 block text-lg font-extrabold text-[var(--ink)]">{grade}<sup>e</sup> année</span>
              <span className="mt-1 block text-sm text-[var(--muted)]">Exercices, examens et leçons</span>
            </span>
            <ChevronRight aria-hidden="true" className="text-[var(--brand)] transition group-hover:translate-x-1" size={22} />
          </Link>
        ))}
      </section>
    </main>
  );
}

export function ReadOnlyGradeFeed({
  audience,
  gradeValue,
}: Readonly<{ audience: ReadOnlyAudience; gradeValue: string }>): ReactNode {
  if (!isGradeLevel(gradeValue)) {
    notFound();
  }

  const grade = Number(gradeValue) as GradeLevel;
  const localPosts: readonly PreviewPost[] = listDemoPostsByGrade(grade).map((post) => ({
    id: post.id,
    subject: post.subject,
    title: post.title,
    type: displayPostType(post.type),
    due: `Publié le ${post.createdAt.toLocaleDateString("fr-TN")}`,
    authorName: post.authorName,
    description: post.description,
    file: post.file
      ? {
          fileName: post.file.fileName,
          size: post.file.size,
          downloadUrl: `/api/v1/posts/${post.id}/file`,
        }
      : undefined,
  }));
  const posts = [...localPosts, ...gradePreviewPosts[grade]];
  const prefix = audience === "Élève" ? "student-space" : "parent-space";

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-5 py-8 sm:px-8 lg:py-12">
      <Link className="inline-flex items-center gap-2 text-sm font-bold text-[var(--brand)] underline-offset-4 hover:underline" href={`/${prefix}`}>
        <ArrowLeft aria-hidden="true" size={18} />
        Retour aux niveaux
      </Link>

      <section className="mt-8 flex flex-col gap-5 rounded-[2rem] border border-[#cde6ee] bg-gradient-to-br from-[#edf9fc] to-white p-6 shadow-[0_18px_45px_rgba(31,68,100,0.08)] sm:flex-row sm:items-start sm:justify-between sm:p-10">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.15em] text-[#39758a]">Espace {audience} · {grade}<sup>e</sup> année</p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-[-0.035em] text-[var(--ink)]">Publications de la classe</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--muted)]">Les enseignants publient les exercices, examens et notes de cours dans ce fil avec leurs documents PDF téléchargeables.</p>
        </div>
        <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-white text-[var(--brand)] shadow-sm"><NotebookTabs aria-hidden="true" size={26} /></div>
      </section>

      <div className="mt-8 grid gap-4">
        {posts.map((post, index) => (
          <article className="rounded-3xl border border-[var(--line)] bg-white p-6 shadow-[0_10px_30px_rgba(31,68,100,0.06)] sm:p-7" key={`${post.title}-${index}`}>
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex gap-4">
                <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#e8f5f8] text-[var(--brand)]"><FileText aria-hidden="true" size={22} /></div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[#e8f5f8] px-3 py-1 text-xs font-bold text-[#176e91]">{post.type}</span>
                    <span className="text-sm font-semibold text-[var(--muted)]">{post.subject}</span>
                  </div>
                  <h2 className="mt-3 text-lg font-extrabold text-[var(--ink)]">{post.title}</h2>
                  {post.description ? <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{post.description}</p> : null}
                  {post.file ? (
                    <div className="mt-3 inline-flex items-center gap-2 rounded-xl border border-[#b2dde7] bg-[#f0f8fa] px-3 py-1.5 text-xs font-semibold text-[#176281]">
                      <FileText aria-hidden="true" size={15} />
                      <span className="font-bold">{post.file.fileName}</span>
                      <span className="text-[#5b879c]">({formatFileSize(post.file.size)})</span>
                    </div>
                  ) : null}
                  <p className="mt-2 text-sm text-[var(--muted)]">{post.due}{post.authorName ? ` · ${post.authorName}` : ""}</p>
                </div>
              </div>
              <a
                className={`inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold shadow-sm transition ${
                  post.file
                    ? "bg-[var(--brand)] text-white hover:bg-[var(--brand-strong)]"
                    : "border border-[#9ac9d5] text-[var(--brand)] hover:bg-[#eef9fb]"
                }`}
                download={post.file?.fileName ?? "document-exemple.pdf"}
                href={post.file?.downloadUrl ?? "/document-exemple.pdf"}
              >
                <Download aria-hidden="true" size={17} />
                {post.file ? "Télécharger le PDF" : "Télécharger"}
              </a>
            </div>
          </article>
        ))}
      </div>

      <aside className="mt-8 rounded-3xl bg-[var(--ink)] p-6 text-white">
        <div className="flex gap-4"><LockKeyhole aria-hidden="true" className="mt-0.5 shrink-0 text-[#8ed4e5]" size={23} /><div><h2 className="text-lg font-bold">Lecture seule</h2><p className="mt-2 text-sm leading-6 text-[#c6d5e2]">Aucun contenu personnel n’est utilisé dans cet aperçu. Dans la plateforme publiée, le service applique l’autorisation de classe avant de montrer un post ou de délivrer son lien de téléchargement.</p></div></div>
      </aside>
    </main>
  );
}
