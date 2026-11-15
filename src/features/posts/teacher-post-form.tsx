"use client";

import { CheckCircle2, FilePenLine, LoaderCircle, Send } from "lucide-react";
import Link from "next/link";
import { type FormEvent, type ReactNode, useState } from "react";

interface CsrfResponse {
  readonly data?: { readonly token?: string };
}

interface CreatePostResponse {
  readonly data?: {
    readonly post?: {
      readonly grade?: number;
    };
  };
  readonly error?: {
    readonly message?: string;
  };
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

export function TeacherPostForm({
  defaultAuthorName = "",
  sessionToken,
}: Readonly<{
  defaultAuthorName?: string;
  sessionToken?: string;
}> = {}): ReactNode {
  const [authorName, setAuthorName] = useState(defaultAuthorName);
  const [subject, setSubject] = useState("");
  const [grade, setGrade] = useState("1");
  const [type, setType] = useState("EXERCISE");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [publishedGrade, setPublishedGrade] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);
    setPublishedGrade(null);
    setIsSubmitting(true);

    try {
      const csrfToken = await requestCsrfToken();
      let token = sessionToken;
      if (!token && typeof window !== "undefined") {
        try {
          token =
            sessionStorage.getItem("intila9a_demo_session") ??
            new URLSearchParams(window.location.search).get("auth") ??
            undefined;
        } catch {
          // Ignore storage restrictions
        }
      }

      const url = token
        ? `/api/v1/posts?auth=${encodeURIComponent(token)}`
        : "/api/v1/posts";

      const response = await fetch(url, {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
          ...(token ? { "X-Session-Token": token } : {}),
        },
        body: JSON.stringify({
          authorName,
          subject,
          grade: Number(grade),
          type,
          title,
          description,
        }),
      });
      const body = (await response.json()) as CreatePostResponse;

      if (!response.ok || !body.data?.post?.grade) {
        setError(body.error?.message ?? "La publication n’a pas pu être enregistrée.");
        return;
      }

      setPublishedGrade(body.data.post.grade);
      setTitle("");
      setDescription("");
    } catch {
      setError("La publication n’a pas pu être enregistrée. Réessayez.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="rounded-3xl border border-[var(--line)] bg-white p-6 shadow-[0_18px_45px_rgba(31,68,100,0.09)] sm:p-8" onSubmit={submit}>
      <div className="flex items-start gap-3">
        <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#e3f3f7] text-[var(--brand)]"><FilePenLine aria-hidden="true" size={23} /></div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--ink)]">Nouvelle publication</h1>
          <p className="mt-1 text-sm leading-6 text-[var(--muted)]">Choisissez une année, écrivez votre nom et votre matière, puis publiez un exercice, un examen ou une leçon.</p>
        </div>
      </div>

      <div className="mt-7 grid gap-5 sm:grid-cols-2">
        <Field label="Votre nom" htmlFor="author-name">
          <input autoComplete="name" className="field" id="author-name" maxLength={100} onChange={(event) => setAuthorName(event.target.value)} required value={authorName} />
        </Field>
        <Field label="Matière" htmlFor="subject">
          <input className="field" id="subject" maxLength={80} onChange={(event) => setSubject(event.target.value)} placeholder="Mathématiques, Sciences…" required value={subject} />
        </Field>
        <Field label="Année" htmlFor="grade">
          <select className="field" id="grade" onChange={(event) => setGrade(event.target.value)} value={grade}>
            {[1, 2, 3, 4, 5, 6].map((level) => <option key={level} value={level}>{level}e année</option>)}
          </select>
        </Field>
        <Field label="Type" htmlFor="post-type">
          <select className="field" id="post-type" onChange={(event) => setType(event.target.value)} value={type}>
            <option value="EXERCISE">Exercice</option>
            <option value="EXAM">Examen</option>
            <option value="LESSON_NOTE">Leçon</option>
          </select>
        </Field>
      </div>

      <div className="mt-5 grid gap-5">
        <Field label="Titre" htmlFor="title">
          <input className="field" id="title" maxLength={160} onChange={(event) => setTitle(event.target.value)} placeholder="Ex. Révision des fractions" required value={title} />
        </Field>
        <Field label="Consigne ou description" htmlFor="description">
          <textarea className="field min-h-32 resize-y py-3" id="description" maxLength={4000} onChange={(event) => setDescription(event.target.value)} placeholder="Écrivez les consignes de l’exercice ou de l’examen…" required value={description} />
        </Field>
      </div>

      {error ? <p aria-live="polite" className="mt-5 rounded-xl bg-[#fff0ee] px-4 py-3 text-sm font-medium text-[var(--danger)]" role="alert">{error}</p> : null}
      {publishedGrade ? <div className="mt-5 rounded-xl bg-[#edf8ee] px-4 py-3 text-sm text-[#236332]" role="status"><span className="flex items-center gap-2 font-bold"><CheckCircle2 aria-hidden="true" size={18} /> Publication enregistrée pour la {publishedGrade}<sup>e</sup> année.</span><Link className="mt-2 inline-block font-bold underline underline-offset-4" href={`/student-space/grade/${publishedGrade}`}>Voir le fil de la {publishedGrade}<sup>e</sup> année</Link></div> : null}

      <button className="mt-7 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand)] px-5 text-sm font-bold text-white shadow-sm transition hover:bg-[var(--brand-strong)] disabled:cursor-not-allowed disabled:opacity-60" disabled={isSubmitting} type="submit">
        {isSubmitting ? <LoaderCircle aria-hidden="true" className="animate-spin" size={18} /> : <Send aria-hidden="true" size={18} />}
        {isSubmitting ? "Publication…" : "Publier"}
      </button>
    </form>
  );
}

function Field({
  children,
  htmlFor,
  label,
}: Readonly<{ children: ReactNode; htmlFor: string; label: string }>): ReactNode {
  return <label className="grid gap-2 text-sm font-semibold text-[var(--ink)]" htmlFor={htmlFor}>{label}{children}</label>;
}
