"use client";

import { CheckCircle2, KeyRound, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { type FormEvent, type ReactNode, useState } from "react";

interface CsrfResponse {
  readonly data?: { readonly token?: string };
}

interface ForgotResponse {
  readonly data?: {
    readonly demoResetPath?: string;
  };
}

async function csrfToken(): Promise<string> {
  const response = await fetch("/api/v1/auth/csrf", {
    credentials: "same-origin",
    cache: "no-store",
  });
  const payload = (await response.json()) as CsrfResponse;

  if (!response.ok || !payload.data?.token) {
    throw new Error("CSRF_BOOTSTRAP_FAILED");
  }

  return payload.data.token;
}

export function ForgotPasswordForm(): ReactNode {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [demoPath, setDemoPath] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const token = await csrfToken();
      const response = await fetch("/api/v1/auth/forgot-password", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": token },
        body: JSON.stringify({ email }),
      });
      const payload = (await response.json()) as ForgotResponse;
      setDemoPath(payload.data?.demoResetPath ?? null);
      setCompleted(response.ok);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="rounded-3xl border border-[var(--line)] bg-white p-6 shadow-[0_20px_60px_rgba(31,68,100,0.12)] sm:p-8" onSubmit={submit}>
      <div className="flex items-center gap-3">
        <div className="grid size-11 place-items-center rounded-2xl bg-[#e3f3f7] text-[var(--brand)]"><KeyRound aria-hidden="true" size={23} /></div>
        <div><h1 className="text-2xl font-bold text-[var(--ink)]">Réinitialiser le mot de passe</h1><p className="mt-1 text-sm text-[var(--muted)]">Nous vous enverrons des instructions si ce compte existe.</p></div>
      </div>
      <label className="mt-7 grid gap-2 text-sm font-semibold text-[var(--ink)]" htmlFor="reset-email">Adresse e-mail
        <input autoComplete="email" className="min-h-12 rounded-xl border border-[#bdcad8] px-4 font-normal outline-none focus:border-[var(--brand)] focus:ring-4 focus:ring-[#bde5ef]" id="reset-email" onChange={(event) => setEmail(event.target.value)} required type="email" value={email} />
      </label>
      <button className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand)] px-5 text-sm font-bold text-white transition hover:bg-[var(--brand-strong)] disabled:opacity-60" disabled={isSubmitting} type="submit">
        {isSubmitting ? <LoaderCircle aria-hidden="true" className="animate-spin" size={18} /> : null} {isSubmitting ? "Envoi…" : "Envoyer les instructions"}
      </button>
      {completed ? <div className="mt-5 rounded-xl bg-[#edf8ee] p-4 text-sm text-[#236332]" role="status"><span className="flex items-center gap-2 font-bold"><CheckCircle2 aria-hidden="true" size={18} /> Vérifiez votre boîte de réception.</span>{demoPath ? <Link className="mt-3 block font-bold underline underline-offset-4" href={demoPath}>Ouvrir le lien de démonstration</Link> : null}</div> : null}
      <Link className="mt-5 block text-center text-sm font-bold text-[var(--brand)] underline-offset-4 hover:underline" href="/login">Retour à la connexion</Link>
    </form>
  );
}

export function ResetPasswordForm(): ReactNode {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    if (newPassword !== confirmation) {
      setMessage("Les mots de passe ne correspondent pas.");
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const csrf = await csrfToken();
      const response = await fetch("/api/v1/auth/reset-password", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": csrf },
        body: JSON.stringify({ token, newPassword }),
      });
      setMessage(response.ok ? "Mot de passe mis à jour. Vous pouvez maintenant vous connecter." : "Le lien est invalide ou expiré.");
    } catch {
      setMessage("La demande n’a pas pu être traitée. Réessayez.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="rounded-3xl border border-[var(--line)] bg-white p-6 shadow-[0_20px_60px_rgba(31,68,100,0.12)] sm:p-8" onSubmit={submit}>
      <h1 className="text-2xl font-bold text-[var(--ink)]">Choisissez un nouveau mot de passe</h1>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Utilisez au moins 12 caractères, avec une majuscule, une minuscule, un chiffre et un symbole.</p>
      <label className="mt-7 grid gap-2 text-sm font-semibold text-[var(--ink)]" htmlFor="new-password">Nouveau mot de passe
        <input autoComplete="new-password" className="min-h-12 rounded-xl border border-[#bdcad8] px-4 font-normal outline-none focus:border-[var(--brand)] focus:ring-4 focus:ring-[#bde5ef]" id="new-password" minLength={12} onChange={(event) => setNewPassword(event.target.value)} required type="password" value={newPassword} />
      </label>
      <label className="mt-5 grid gap-2 text-sm font-semibold text-[var(--ink)]" htmlFor="confirm-password">Confirmer le mot de passe
        <input autoComplete="new-password" className="min-h-12 rounded-xl border border-[#bdcad8] px-4 font-normal outline-none focus:border-[var(--brand)] focus:ring-4 focus:ring-[#bde5ef]" id="confirm-password" minLength={12} onChange={(event) => setConfirmation(event.target.value)} required type="password" value={confirmation} />
      </label>
      {message ? <p aria-live="polite" className="mt-5 rounded-xl bg-[#edf8ee] p-4 text-sm text-[#236332]" role="status">{message}</p> : null}
      <button className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand)] px-5 text-sm font-bold text-white transition hover:bg-[var(--brand-strong)] disabled:opacity-60" disabled={isSubmitting || !token} type="submit">{isSubmitting ? <LoaderCircle aria-hidden="true" className="animate-spin" size={18} /> : null}{isSubmitting ? "Mise à jour…" : "Mettre à jour"}</button>
      <Link className="mt-5 block text-center text-sm font-bold text-[var(--brand)] underline-offset-4 hover:underline" href="/login">Retour à la connexion</Link>
    </form>
  );
}
