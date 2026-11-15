"use client";

import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Download,
  Eye,
  EyeOff,
  FileCheck,
  FileText,
  Filter,
  Layers,
  Megaphone,
  PlusCircle,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import { TeacherPostForm } from "@/features/posts/teacher-post-form";
import type { SessionPrincipal } from "@/server/auth/types";
import type { DemoPostAudience, DemoPostType } from "@/server/posts/demo-post-store";

export interface PostItem {
  readonly id: string;
  readonly authorName: string;
  readonly authorRole: "DIRECTOR" | "TEACHER" | "STUDENT" | "PARENT";
  readonly subject: string;
  readonly grade: number;
  readonly title: string;
  readonly description: string;
  readonly type: DemoPostType;
  readonly audience: DemoPostAudience;
  readonly hasFile: boolean;
  readonly fileName?: string;
  readonly fileSize?: number;
  readonly createdAt: string;
  readonly deletedAt?: string | null;
  readonly deletedReason?: string | null;
}

interface CsrfResponse {
  readonly data?: { readonly token?: string };
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function audienceLabel(audience?: DemoPostAudience): string {
  switch (audience) {
    case "STUDENTS":
      return "🎒 Élèves uniquement";
    case "PARENTS":
      return "👨‍👩‍👧 Parents uniquement";
    case "ALL":
    default:
      return "👥 Toute la communauté";
  }
}

function postTypeLabel(type: DemoPostType): { label: string; color: string } {
  switch (type) {
    case "ANNOUNCEMENT":
      return { label: "Annonce", color: "bg-amber-100 text-amber-800 border-amber-300" };
    case "EXAM":
      return { label: "Examen", color: "bg-rose-100 text-rose-800 border-rose-300" };
    case "LESSON_NOTE":
      return { label: "Leçon", color: "bg-sky-100 text-sky-800 border-sky-300" };
    case "EXERCISE":
    default:
      return { label: "Exercice", color: "bg-emerald-100 text-emerald-800 border-emerald-300" };
  }
}

async function requestCsrfToken(): Promise<string> {
  const response = await fetch("/api/v1/auth/csrf", {
    method: "GET",
    credentials: "same-origin",
    cache: "no-store",
  });
  const body = (await response.json()) as CsrfResponse;
  if (!response.ok || !body.data?.token) {
    throw new Error("CSRF_BOOTSTRAP_FAILED");
  }
  return body.data.token;
}

export function DirectorDashboard({
  principal,
  sessionToken,
}: Readonly<{
  principal: SessionPrincipal;
  sessionToken?: string;
}>): ReactNode {
  const [activeTab, setActiveTab] = useState<"moderation" | "publish">("moderation");
  const [posts, setPosts] = useState<readonly PostItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [gradeFilter, setGradeFilter] = useState<string>("ALL");
  const [audienceFilter, setAudienceFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [showDeleted, setShowDeleted] = useState(false);

  // Deletion modal state
  const [postToDelete, setPostToDelete] = useState<PostItem | null>(null);
  const [deleteReason, setDeleteReason] = useState("Information obsolète ou modification du programme");
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      let token = sessionToken;
      if (!token && typeof window !== "undefined") {
        token =
          sessionStorage.getItem("intila9a_demo_session") ??
          new URLSearchParams(window.location.search).get("auth") ??
          undefined;
      }

      const url = token
        ? `/api/v1/posts?auth=${encodeURIComponent(token)}`
        : "/api/v1/posts";

      const res = await fetch(url, {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
        headers: token ? { "X-Session-Token": token } : {},
      });
      const data = await res.json();
      if (res.ok && data.data?.posts) {
        setPosts(data.data.posts);
      } else {
        setErrorMessage("Impossible de charger les publications de l'école.");
      }
    } catch {
      setErrorMessage("Erreur de connexion lors du chargement des publications.");
    } finally {
      setIsLoading(false);
    }
  }, [sessionToken]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Statistics
  const stats = useMemo(() => {
    const total = posts.length;
    const active = posts.filter((p) => !p.deletedAt).length;
    const deleted = posts.filter((p) => Boolean(p.deletedAt)).length;
    const withPdf = posts.filter((p) => p.hasFile && !p.deletedAt).length;
    const schoolWide = posts.filter((p) => p.grade === 0 && !p.deletedAt).length;
    return { total, active, deleted, withPdf, schoolWide };
  }, [posts]);

  // Filtered posts
  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      // Deleted filter
      if (!showDeleted && post.deletedAt) return false;
      if (showDeleted && !post.deletedAt) return false;

      // Grade filter
      if (gradeFilter !== "ALL") {
        if (post.grade !== Number(gradeFilter)) return false;
      }

      // Audience filter
      if (audienceFilter !== "ALL") {
        if (post.audience !== audienceFilter) return false;
      }

      // Type filter
      if (typeFilter !== "ALL") {
        if (post.type !== typeFilter) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = post.title.toLowerCase().includes(q);
        const matchesSubject = post.subject.toLowerCase().includes(q);
        const matchesAuthor = post.authorName.toLowerCase().includes(q);
        const matchesDescription = post.description.toLowerCase().includes(q);
        if (!matchesTitle && !matchesSubject && !matchesAuthor && !matchesDescription) {
          return false;
        }
      }

      return true;
    });
  }, [posts, showDeleted, gradeFilter, audienceFilter, typeFilter, searchQuery]);

  async function handleDeletePost(): Promise<void> {
    if (!postToDelete) return;
    setIsDeleting(true);
    setErrorMessage(null);

    try {
      const csrfToken = await requestCsrfToken();
      let token = sessionToken;
      if (!token && typeof window !== "undefined") {
        token =
          sessionStorage.getItem("intila9a_demo_session") ??
          new URLSearchParams(window.location.search).get("auth") ??
          undefined;
      }

      const url = token
        ? `/api/v1/posts/${postToDelete.id}?auth=${encodeURIComponent(token)}`
        : `/api/v1/posts/${postToDelete.id}`;

      const res = await fetch(url, {
        method: "DELETE",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
          ...(token ? { "X-Session-Token": token } : {}),
        },
        body: JSON.stringify({ reason: deleteReason }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.message ?? "Erreur lors de la suppression.");
      }

      setSuccessMessage(`La publication "${postToDelete.title}" a été supprimée et archivée.`);
      setPostToDelete(null);
      await fetchPosts();
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : "Impossible de supprimer la publication.",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <section aria-label="Statistiques de publication" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-[var(--muted)]">
            <span className="text-xs font-bold uppercase tracking-wider">Publications actives</span>
            <Layers aria-hidden="true" className="text-[var(--brand)]" size={18} />
          </div>
          <p className="mt-3 text-3xl font-black text-[var(--ink)]">{stats.active}</p>
          <p className="mt-1 text-xs text-[var(--muted)]">{stats.schoolWide} pour toute l’école</p>
        </div>

        <div className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-[var(--muted)]">
            <span className="text-xs font-bold uppercase tracking-wider">Avec PDF joint</span>
            <FileCheck aria-hidden="true" className="text-emerald-600" size={18} />
          </div>
          <p className="mt-3 text-3xl font-black text-emerald-700">{stats.withPdf}</p>
          <p className="mt-1 text-xs text-[var(--muted)]">Téléchargeables par les familles</p>
        </div>

        <div className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-[var(--muted)]">
            <span className="text-xs font-bold uppercase tracking-wider">Publications modérées</span>
            <ShieldAlert aria-hidden="true" className="text-rose-600" size={18} />
          </div>
          <p className="mt-3 text-3xl font-black text-rose-700">{stats.deleted}</p>
          <p className="mt-1 text-xs text-[var(--muted)]">Archivées avec motif</p>
        </div>

        <div className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-[var(--muted)]">
            <span className="text-xs font-bold uppercase tracking-wider">Totalité historique</span>
            <BookOpen aria-hidden="true" className="text-indigo-600" size={18} />
          </div>
          <p className="mt-3 text-3xl font-black text-indigo-700">{stats.total}</p>
          <p className="mt-1 text-xs text-[var(--muted)]">Toutes années confondues</p>
        </div>
      </section>

      {/* Tabs navigation */}
      <div className="flex flex-col justify-between gap-4 border-b border-[var(--line)] pb-4 sm:flex-row sm:items-center">
        <div className="flex gap-2">
          <button
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
              activeTab === "moderation"
                ? "bg-[var(--brand)] text-white shadow-sm"
                : "bg-white text-[var(--muted)] hover:bg-[#f1f7fa] hover:text-[var(--ink)]"
            }`}
            onClick={() => setActiveTab("moderation")}
            type="button"
          >
            <ShieldCheck aria-hidden="true" size={18} />
            Modération des publications ({stats.active})
          </button>
          <button
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
              activeTab === "publish"
                ? "bg-[var(--brand)] text-white shadow-sm"
                : "bg-white text-[var(--muted)] hover:bg-[#f1f7fa] hover:text-[var(--ink)]"
            }`}
            onClick={() => setActiveTab("publish")}
            type="button"
          >
            <PlusCircle aria-hidden="true" size={18} />
            Publier une annonce / consigne
          </button>
        </div>

        {activeTab === "moderation" ? (
          <div className="flex items-center gap-2">
            <button
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-xs font-bold text-[var(--muted)] transition hover:text-[var(--ink)]"
              disabled={isLoading}
              onClick={() => fetchPosts()}
              title="Rafraîchir la liste"
              type="button"
            >
              <RefreshCw aria-hidden="true" className={isLoading ? "animate-spin" : ""} size={14} />
              Actualiser
            </button>
            <button
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition ${
                showDeleted
                  ? "border-rose-300 bg-rose-50 text-rose-700"
                  : "border-[var(--line)] bg-white text-[var(--muted)] hover:text-[var(--ink)]"
              }`}
              onClick={() => setShowDeleted(!showDeleted)}
              type="button"
            >
              {showDeleted ? <EyeOff aria-hidden="true" size={14} /> : <Eye aria-hidden="true" size={14} />}
              {showDeleted ? "Masquer les supprimées" : `Voir supprimées (${stats.deleted})`}
            </button>
          </div>
        ) : null}
      </div>

      {/* Notifications */}
      {successMessage ? (
        <div className="flex items-center justify-between rounded-2xl bg-emerald-50 border border-emerald-200 px-5 py-4 text-emerald-800" role="status">
          <div className="flex items-center gap-3">
            <CheckCircle2 aria-hidden="true" className="text-emerald-600" size={20} />
            <p className="text-sm font-semibold">{successMessage}</p>
          </div>
          <button
            aria-label="Fermer la notification"
            className="text-emerald-700 hover:text-emerald-900"
            onClick={() => setSuccessMessage(null)}
            type="button"
          >
            <X aria-hidden="true" size={18} />
          </button>
        </div>
      ) : null}

      {errorMessage ? (
        <div className="flex items-center justify-between rounded-2xl bg-rose-50 border border-rose-200 px-5 py-4 text-rose-800" role="alert">
          <div className="flex items-center gap-3">
            <AlertTriangle aria-hidden="true" className="text-rose-600" size={20} />
            <p className="text-sm font-semibold">{errorMessage}</p>
          </div>
          <button
            aria-label="Fermer la notification"
            className="text-rose-700 hover:text-rose-900"
            onClick={() => setErrorMessage(null)}
            type="button"
          >
            <X aria-hidden="true" size={18} />
          </button>
        </div>
      ) : null}

      {/* Tab: Moderation */}
      {activeTab === "moderation" ? (
        <section className="space-y-6">
          {/* Filter Bar */}
          <div className="rounded-2xl border border-[var(--line)] bg-white p-4 shadow-sm">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {/* Search */}
              <div className="relative">
                <Search aria-hidden="true" className="absolute left-3 top-3 text-[var(--muted)]" size={16} />
                <input
                  className="w-full rounded-xl border border-[var(--line)] bg-[#fbfdfe] py-2 pl-9 pr-3 text-sm placeholder:text-[var(--muted)] focus:border-[var(--brand)] focus:outline-none"
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher par titre, auteur…"
                  type="text"
                  value={searchQuery}
                />
              </div>

              {/* Grade Filter */}
              <div className="relative">
                <select
                  aria-label="Filtrer par niveau ou classe"
                  className="w-full rounded-xl border border-[var(--line)] bg-[#fbfdfe] py-2 px-3 text-sm focus:border-[var(--brand)] focus:outline-none"
                  onChange={(e) => setGradeFilter(e.target.value)}
                  value={gradeFilter}
                >
                  <option value="ALL">🏫 Tous les niveaux</option>
                  <option value="0">Toute l’école (Global)</option>
                  {[1, 2, 3, 4, 5, 6].map((g) => (
                    <option key={g} value={String(g)}>
                      {g}e année
                    </option>
                  ))}
                </select>
              </div>

              {/* Audience Filter */}
              <div className="relative">
                <select
                  aria-label="Filtrer par public visé"
                  className="w-full rounded-xl border border-[var(--line)] bg-[#fbfdfe] py-2 px-3 text-sm focus:border-[var(--brand)] focus:outline-none"
                  onChange={(e) => setAudienceFilter(e.target.value)}
                  value={audienceFilter}
                >
                  <option value="ALL">👥 Tous les publics</option>
                  <option value="STUDENTS">🎒 Élèves uniquement</option>
                  <option value="PARENTS">👨‍👩‍👧 Parents uniquement</option>
                </select>
              </div>

              {/* Type Filter */}
              <div className="relative">
                <select
                  aria-label="Filtrer par type de contenu"
                  className="w-full rounded-xl border border-[var(--line)] bg-[#fbfdfe] py-2 px-3 text-sm focus:border-[var(--brand)] focus:outline-none"
                  onChange={(e) => setTypeFilter(e.target.value)}
                  value={typeFilter}
                >
                  <option value="ALL">📑 Tous les types</option>
                  <option value="ANNOUNCEMENT">Annonce</option>
                  <option value="EXERCISE">Exercice</option>
                  <option value="EXAM">Examen</option>
                  <option value="LESSON_NOTE">Leçon</option>
                </select>
              </div>
            </div>
          </div>

          {/* Posts Feed / List */}
          {filteredPosts.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[#bdcad8] bg-white p-12 text-center">
              <Filter aria-hidden="true" className="mx-auto text-[var(--muted)]" size={36} />
              <p className="mt-4 text-base font-bold text-[var(--ink)]">Aucune publication trouvée</p>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {showDeleted
                  ? "Aucune publication n'a été supprimée ou archivée."
                  : "Aucune publication ne correspond à vos filtres actuels."}
              </p>
              <button
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#eef7fa] px-4 py-2 text-xs font-bold text-[var(--brand)] hover:bg-[#e1f1f6]"
                onClick={() => {
                  setSearchQuery("");
                  setGradeFilter("ALL");
                  setAudienceFilter("ALL");
                  setTypeFilter("ALL");
                }}
                type="button"
              >
                Réinitialiser les filtres
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPosts.map((post) => {
                const typeStyle = postTypeLabel(post.type);
                const isSchoolWide = post.grade === 0;

                return (
                  <article
                    className={`rounded-3xl border p-6 shadow-sm transition hover:shadow-md ${
                      post.deletedAt
                        ? "border-rose-200 bg-rose-50/40"
                        : "border-[var(--line)] bg-white"
                    }`}
                    key={post.id}
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      {/* Left: Content */}
                      <div className="space-y-3">
                        {/* Tags */}
                        <div className="flex flex-wrap items-center gap-2">
                          {isSchoolWide ? (
                            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-extrabold text-amber-800">
                              🏫 Toute l’école
                            </span>
                          ) : (
                            <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-extrabold text-indigo-800">
                              🎒 {post.grade}e année
                            </span>
                          )}

                          <span
                            className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${typeStyle.color}`}
                          >
                            {typeStyle.label}
                          </span>

                          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                            {audienceLabel(post.audience)}
                          </span>

                          <span className="text-xs font-bold text-[var(--muted)]">
                            · {post.subject}
                          </span>
                        </div>

                        {/* Title & Desc */}
                        <h3 className="text-lg font-extrabold text-[var(--ink)]">{post.title}</h3>
                        <p className="max-w-3xl text-sm leading-relaxed text-[var(--muted)] whitespace-pre-wrap">
                          {post.description}
                        </p>

                        {/* File Attachment */}
                        {post.hasFile && post.fileName ? (
                          <div className="inline-flex items-center gap-3 rounded-2xl border border-[#b2dde7] bg-[#f0f8fa] px-4 py-2 text-xs">
                            <FileText aria-hidden="true" className="text-[var(--brand)]" size={16} />
                            <div>
                              <span className="font-bold text-[#176281]">{post.fileName}</span>
                              {post.fileSize ? (
                                <span className="ml-1 text-[#5b879c]">({formatFileSize(post.fileSize)})</span>
                              ) : null}
                            </div>
                            <a
                              className="ml-2 inline-flex items-center gap-1 font-bold text-[var(--brand)] hover:underline"
                              download={post.fileName}
                              href={`/api/v1/posts/${post.id}/file`}
                            >
                              <Download aria-hidden="true" size={13} />
                              Télécharger
                            </a>
                          </div>
                        ) : null}

                        {/* Meta: Author & Date */}
                        <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--muted)] pt-1">
                          <span>
                            Par <strong className="text-[var(--ink)]">{post.authorName}</strong> (
                            {post.authorRole === "DIRECTOR" ? "Direction" : "Enseignant"})
                          </span>
                          <span>·</span>
                          <span>{new Date(post.createdAt).toLocaleDateString("fr-TN", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}</span>
                        </div>

                        {/* Deleted notice if applicable */}
                        {post.deletedAt ? (
                          <div className="rounded-xl border border-rose-200 bg-rose-100/70 px-4 py-2.5 text-xs text-rose-900">
                            <span className="font-bold">🚫 Publication supprimée / masquée :</span>{" "}
                            {post.deletedReason ?? "Supprimée par la Direction"} le{" "}
                            {new Date(post.deletedAt).toLocaleDateString("fr-TN", {
                              day: "numeric",
                              month: "long",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        ) : null}
                      </div>

                      {/* Right: Actions */}
                      <div className="flex shrink-0 items-center gap-2 pt-2 lg:pt-0">
                        {!post.deletedAt ? (
                          <button
                            className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-white px-3.5 py-2 text-xs font-bold text-rose-700 shadow-sm transition hover:bg-rose-50 hover:border-rose-300"
                            onClick={() => {
                              setPostToDelete(post);
                              setDeleteReason("Information obsolète ou modification du programme");
                            }}
                            type="button"
                          >
                            <Trash2 aria-hidden="true" size={15} />
                            Supprimer
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-xl bg-rose-200/60 px-3 py-1.5 text-xs font-bold text-rose-800">
                            <ShieldAlert aria-hidden="true" size={14} />
                            Archivée
                          </span>
                        )}

                        <Link
                          className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-xs font-bold text-[var(--muted)] transition hover:text-[var(--ink)]"
                          href={post.grade === 0 ? "/student-space" : `/student-space/grade/${post.grade}`}
                          target="_blank"
                        >
                          <Eye aria-hidden="true" size={14} />
                          Aperçu public
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      ) : null}

      {/* Tab: Publish Announcement / Post */}
      {activeTab === "publish" ? (
        <section className="space-y-6">
          <div className="rounded-3xl border border-[var(--line)] bg-gradient-to-br from-[#edf9fc] to-white p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[var(--brand)] text-white shadow-sm">
                <Megaphone aria-hidden="true" size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[var(--ink)]">
                  Publication officielle de la Direction
                </h2>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  Publiez une annonce administrative, une consigne sanitaire, une note pour un niveau spécifique ou toute l’école avec fichier PDF téléchargeable.
                </p>
              </div>
            </div>
          </div>

          <TeacherPostForm
            allowSchoolWide={true}
            defaultAuthorName={`${principal.firstName} ${principal.lastName} (Direction)`}
            defaultSubject="Direction de l'école"
            onPostCreated={() => {
              setSuccessMessage("Votre publication a été transmise avec succès.");
              fetchPosts();
              setActiveTab("moderation");
            }}
            sessionToken={sessionToken}
          />
        </section>
      ) : null}

      {/* Delete / Moderation Confirmation Modal */}
      {postToDelete ? (
        <div
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          role="dialog"
        >
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
            <div className="flex items-center gap-3 text-rose-700">
              <div className="grid size-10 place-items-center rounded-xl bg-rose-100">
                <AlertTriangle aria-hidden="true" size={22} />
              </div>
              <h3 className="text-lg font-bold">Confirmer la suppression</h3>
            </div>

            <p className="mt-4 text-sm text-[var(--muted)]">
              Êtes-vous sûr de vouloir retirer la publication{" "}
              <strong className="text-[var(--ink)]">"{postToDelete.title}"</strong> ? Elle ne sera plus visible par les élèves ni les parents dans le fil de classe.
            </p>

            <div className="mt-5">
              <label className="block text-xs font-bold text-[var(--ink)]" htmlFor="delete-reason">
                Motif de la modération (archivé pour l'audit)
              </label>
              <select
                className="mt-2 w-full rounded-xl border border-[var(--line)] bg-[#fbfdfe] p-3 text-sm focus:border-rose-500 focus:outline-none"
                id="delete-reason"
                onChange={(e) => setDeleteReason(e.target.value)}
                value={deleteReason}
              >
                <option value="Information obsolète ou modification du programme">
                  Information obsolète ou modification du programme
                </option>
                <option value="Erreur de classe ou de niveau cible">
                  Erreur de classe ou de niveau cible
                </option>
                <option value="Doublon d’un devoir déjà publié">
                  Doublon d’un devoir déjà publié
                </option>
                <option value="Document PDF ou consigne non conforme">
                  Document PDF ou consigne non conforme
                </option>
                <option value="Autre motif administratif">Autre motif administratif</option>
              </select>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                className="rounded-xl border border-[var(--line)] px-4 py-2.5 text-sm font-bold text-[var(--muted)] hover:bg-[#f2f4f7]"
                disabled={isDeleting}
                onClick={() => setPostToDelete(null)}
                type="button"
              >
                Annuler
              </button>
              <button
                className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-rose-700 disabled:opacity-60"
                disabled={isDeleting}
                onClick={handleDeletePost}
                type="button"
              >
                {isDeleting ? "Suppression…" : "Confirmer le retrait"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
