"use client";

import {
  Bell,
  Calendar,
  CheckCircle2,
  Download,
  FileText,
  Megaphone,
  PlusCircle,
  RefreshCw,
  Search,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import type { ReactNode } from "react";
import { useCallback, useMemo, useState } from "react";

import { TeacherPostForm } from "@/features/posts/teacher-post-form";

export interface SerializedTeacherPost {
  readonly id: string;
  readonly authorName: string;
  readonly authorRole: string;
  readonly subject: string;
  readonly grade: number;
  readonly title: string;
  readonly description: string;
  readonly type: string;
  readonly audience?: string;
  readonly hasFile?: boolean;
  readonly fileName?: string;
  readonly fileSize?: number;
  readonly createdAt: string;
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return "0 Ko";
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function formatPostDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString("fr-TN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return isoString;
  }
}

function postTypeBadge(type: string): { label: string; color: string } {
  switch (type) {
    case "ANNOUNCEMENT":
      return {
        label: "Annonce / Convocation",
        color: "bg-amber-100 text-amber-900 border-amber-300",
      };
    case "EXAM":
      return {
        label: "Examen / Évaluation",
        color: "bg-rose-100 text-rose-900 border-rose-300",
      };
    case "LESSON_NOTE":
      return {
        label: "Leçon / Cours",
        color: "bg-sky-100 text-sky-900 border-sky-300",
      };
    case "EXERCISE":
    default:
      return {
        label: "Exercice / Travail",
        color: "bg-emerald-100 text-emerald-900 border-emerald-300",
      };
  }
}

export function TeacherSpace({
  initialPosts = [],
  currentUserName,
  isDirector = false,
  sessionToken,
}: Readonly<{
  initialPosts?: readonly SerializedTeacherPost[];
  currentUserName: string;
  isDirector?: boolean;
  sessionToken?: string;
}>): ReactNode {
  const [activeTab, setActiveTab] = useState<"announcements" | "publish">(
    "announcements",
  );
  const [posts, setPosts] = useState<readonly SerializedTeacherPost[]>(initialPosts);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("ALL");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchPosts = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      const url = sessionToken
        ? `/api/v1/posts?auth=${encodeURIComponent(sessionToken)}`
        : "/api/v1/posts";
      const response = await fetch(url, { cache: "no-store" });
      if (response.ok) {
        const body = (await response.json()) as {
          data?: { posts?: readonly SerializedTeacherPost[] };
        };
        const allPosts = body.data?.posts ?? [];
        // Filter for announcements intended for teachers:
        // - Explicitly audience === "TEACHERS"
        // - Or Director announcements broadcast school-wide
        const teacherPosts = allPosts.filter(
          (p) =>
            p.audience === "TEACHERS" ||
            (p.authorRole === "DIRECTOR" &&
              (p.audience === "ALL" || p.type === "ANNOUNCEMENT")),
        );
        setPosts(teacherPosts);
      }
    } catch {
      // Keep existing posts if fetch fails
    } finally {
      setIsLoading(false);
    }
  }, [sessionToken]);

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      if (filterType !== "ALL" && post.type !== filterType) {
        return false;
      }
      if (searchQuery.trim().length > 0) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = post.title.toLowerCase().includes(query);
        const matchesDesc = post.description.toLowerCase().includes(query);
        const matchesSubject = post.subject.toLowerCase().includes(query);
        const matchesAuthor = post.authorName.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc && !matchesSubject && !matchesAuthor) {
          return false;
        }
      }
      return true;
    });
  }, [posts, filterType, searchQuery]);

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-[#c2e2ec] bg-gradient-to-br from-[#ebf7fb] via-[#f5fbfe] to-white p-6 sm:p-8 shadow-[0_12px_32px_rgba(20,108,148,0.08)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#a2cfdf] bg-white/90 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#1a6482]">
              <ShieldCheck aria-hidden="true" size={14} />
              École Primaire Intila9a Foussana
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[var(--ink)] sm:text-3xl">
              Espace Corps Enseignant
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-[var(--muted)]">
              Accédez aux convocations, réunions pédagogiques et avis de M. Fethi Omri (Directeur), ou publiez vos cours et devoirs avec support PDF.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition ${
                activeTab === "announcements"
                  ? "bg-[var(--brand)] text-white shadow-md shadow-[var(--brand)]/20"
                  : "border border-[var(--line)] bg-white text-[var(--ink)] hover:bg-[#f1f7fa]"
              }`}
              onClick={() => setActiveTab("announcements")}
              type="button"
            >
              <Megaphone aria-hidden="true" size={16} />
              Avis de la Direction
              <span className="ml-1 rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-black">
                {posts.length}
              </span>
            </button>
            <button
              className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition ${
                activeTab === "publish"
                  ? "bg-[var(--brand)] text-white shadow-md shadow-[var(--brand)]/20"
                  : "border border-[var(--line)] bg-white text-[var(--ink)] hover:bg-[#f1f7fa]"
              }`}
              onClick={() => setActiveTab("publish")}
              type="button"
            >
              <PlusCircle aria-hidden="true" size={16} />
              Publier un document
            </button>
          </div>
        </div>
      </section>

      {/* Success Notification */}
      {successMessage ? (
        <div className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-emerald-900 shadow-sm">
          <div className="flex items-center gap-3">
            <CheckCircle2 aria-hidden="true" className="text-emerald-600" size={20} />
            <p className="text-sm font-semibold">{successMessage}</p>
          </div>
          <button
            className="text-xs font-bold text-emerald-700 underline hover:text-emerald-900"
            onClick={() => setSuccessMessage(null)}
            type="button"
          >
            Fermer
          </button>
        </div>
      ) : null}

      {/* Tab 1: Avis & Réunions de la Direction */}
      {activeTab === "announcements" ? (
        <section className="space-y-6">
          {/* Header & Controls */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-2xl bg-[#e3f4f9] text-[#146c94]">
                <Bell aria-hidden="true" size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[var(--ink)]">
                  Convocations, Événements & Réunions
                </h2>
                <p className="text-xs text-[var(--muted)]">
                  Communications officielles transmises par la Direction pour l’équipe pédagogique
                </p>
              </div>
            </div>

            <button
              className="inline-flex items-center gap-2 self-start rounded-xl border border-[var(--line)] bg-white px-3.5 py-2 text-xs font-bold text-[var(--ink)] shadow-sm transition hover:bg-[#f3f8fa]"
              disabled={isLoading}
              onClick={() => fetchPosts()}
              type="button"
            >
              <RefreshCw
                aria-hidden="true"
                className={isLoading ? "animate-spin text-[var(--brand)]" : ""}
                size={14}
              />
              {isLoading ? "Actualisation…" : "Actualiser les avis"}
            </button>
          </div>

          {/* Filter Bar */}
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="relative sm:col-span-2">
              <Search
                aria-hidden="true"
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]"
                size={16}
              />
              <input
                className="w-full rounded-2xl border border-[var(--line)] bg-white py-2.5 pl-10 pr-4 text-sm text-[var(--ink)] placeholder:text-[var(--muted)] focus:border-[var(--brand)] focus:outline-none"
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher par titre, mot-clé ou ordre du jour…"
                type="text"
                value={searchQuery}
              />
            </div>

            <div>
              <select
                aria-label="Filtrer par type de document"
                className="w-full rounded-2xl border border-[var(--line)] bg-white py-2.5 px-4 text-sm text-[var(--ink)] focus:border-[var(--brand)] focus:outline-none"
                onChange={(e) => setFilterType(e.target.value)}
                value={filterType}
              >
                <option value="ALL">Tous les types d'avis</option>
                <option value="ANNOUNCEMENT">Convocations & Annonces</option>
                <option value="LESSON_NOTE">Notes administratives & Circulaires</option>
                <option value="EXAM">Calendrier d'examens</option>
              </select>
            </div>
          </div>

          {/* Announcements List */}
          {filteredPosts.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[#bcdce6] bg-[#f9fdfe] p-10 text-center">
              <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#e6f4f8] text-[#1a6482]">
                <Calendar aria-hidden="true" size={24} />
              </div>
              <h3 className="mt-4 text-base font-bold text-[var(--ink)]">
                Aucun avis ou convocation ne correspond à votre filtre
              </h3>
              <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-[var(--muted)]">
                {searchQuery || filterType !== "ALL"
                  ? "Essayez de modifier ou réinitialiser vos critères de recherche."
                  : "Dès que M. Fethi Omri (Directeur) planifie une réunion ou diffuse une note pour les enseignants, elle s'affichera directement ici."}
              </p>
              {searchQuery || filterType !== "ALL" ? (
                <button
                  className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-[var(--line)] bg-white px-3.5 py-2 text-xs font-bold text-[var(--brand)] hover:bg-[#f1f7fa]"
                  onClick={() => {
                    setSearchQuery("");
                    setFilterType("ALL");
                  }}
                  type="button"
                >
                  Réinitialiser les filtres
                </button>
              ) : null}
            </div>
          ) : (
            <div className="grid gap-5">
              {filteredPosts.map((post) => {
                const badge = postTypeBadge(post.type);
                const isDirectorPost =
                  post.authorRole === "DIRECTOR" ||
                  post.authorName.toLowerCase().includes("direct");

                return (
                  <article
                    className="overflow-hidden rounded-3xl border border-[var(--line)] bg-white p-6 shadow-[0_4px_20px_rgba(20,108,148,0.05)] transition hover:border-[#a8d3e2] sm:p-7"
                    key={post.id}
                  >
                    {/* Top Meta Header */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)]/60 pb-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold ${badge.color}`}
                        >
                          {badge.label}
                        </span>

                        <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-900">
                          👨‍🏫 Réservé aux Enseignants
                        </span>

                        {isDirectorPost ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-[#b2dbea] bg-[#eef8fb] px-2.5 py-0.5 text-xs font-extrabold text-[#115d80]">
                            <ShieldCheck aria-hidden="true" size={13} />
                            Direction M. Fethi Omri
                          </span>
                        ) : null}
                      </div>

                      <span className="text-xs font-medium text-[var(--muted)]">
                        {formatPostDate(post.createdAt)}
                      </span>
                    </div>

                    {/* Post Content */}
                    <div className="pt-4">
                      <div className="flex items-baseline justify-between gap-2">
                        <h3 className="text-lg font-extrabold tracking-tight text-[var(--ink)] sm:text-xl">
                          {post.title}
                        </h3>
                      </div>

                      <p className="mt-1 text-xs font-semibold text-[#186a8e]">
                        Catégorie : {post.subject} ·{" "}
                        {post.grade === 0 ? "Toute l'école" : `${post.grade}e Année`}
                      </p>

                      <div className="mt-4 whitespace-pre-line text-sm leading-relaxed text-[#2c4356]">
                        {post.description}
                      </div>

                      {/* Downloadable PDF Attachment */}
                      {post.hasFile && post.fileName ? (
                        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#bde0ec] bg-gradient-to-r from-[#f0f9fc] to-[#e8f6fa] p-4 text-xs">
                          <div className="flex items-center gap-3">
                            <div className="grid size-9 place-items-center rounded-xl bg-white text-[#176281] shadow-sm">
                              <FileText aria-hidden="true" size={18} />
                            </div>
                            <div>
                              <p className="font-extrabold text-[#176281]">
                                {post.fileName}
                              </p>
                              {post.fileSize ? (
                                <p className="text-[11px] text-[#5b879c]">
                                  Document officiel PDF ({formatFileSize(post.fileSize)})
                                </p>
                              ) : null}
                            </div>
                          </div>

                          <a
                            className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--brand)] px-4 py-2 font-bold text-white shadow-sm transition hover:bg-[#12587a]"
                            download={post.fileName}
                            href={`/api/v1/posts/${post.id}/file`}
                          >
                            <Download aria-hidden="true" size={14} />
                            Télécharger la pièce jointe
                          </a>
                        </div>
                      ) : null}

                      {/* Author Signature */}
                      <div className="mt-5 flex items-center justify-between border-t border-[var(--line)]/50 pt-3 text-xs text-[var(--muted)]">
                        <span className="flex items-center gap-1.5">
                          <UserCheck aria-hidden="true" size={14} className="text-[#146c94]" />
                          Signé : <strong className="text-[var(--ink)]">{post.authorName}</strong>
                        </span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      ) : null}

      {/* Tab 2: Publier un document / cours */}
      {activeTab === "publish" ? (
        <section className="space-y-6">
          <div className="rounded-3xl border border-[var(--line)] bg-white p-6 sm:p-8 shadow-[0_8px_25px_rgba(20,108,148,0.06)]">
            <div className="mb-6 border-b border-[var(--line)] pb-5">
              <p className="text-xs font-bold uppercase tracking-wider text-[#146c94]">
                Espace de publication
              </p>
              <h2 className="mt-1 text-xl font-extrabold text-[var(--ink)]">
                Publier pour une classe ou l'équipe pédagogique
              </h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Transmettez un cours, devoir, exercice ou une consigne avec pièce jointe PDF.
              </p>
            </div>

            <TeacherPostForm
              allowSchoolWide={isDirector}
              defaultAuthorName={currentUserName}
              onPostCreated={() => {
                setSuccessMessage("Votre publication a été transmise avec succès.");
                fetchPosts();
                setActiveTab("announcements");
              }}
              sessionToken={sessionToken}
            />
          </div>
        </section>
      ) : null}
    </div>
  );
}
