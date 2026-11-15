"use client";

import { ArrowRight, Eye, EyeOff, KeyRound, LoaderCircle, ShieldCheck } from "lucide-react";
import { type FormEvent, type ReactNode, useState } from "react";

export type PrivilegedAccessRole = "TEACHER" | "DIRECTOR";

interface AccessProfile {
  readonly title: string;
  readonly description: string;
  readonly identifier: string;
  readonly icon: ReactNode;
}

const accessProfiles: Record<PrivilegedAccessRole, AccessProfile> = {
  TEACHER: {
    title: "Espace Enseignant",
    description: "Entrez le mot de passe de votre accès enseignant pour gérer et publier vos contenus de classe.",
    identifier: "teacher@demo.intila9a.local",
    icon: <KeyRound aria-hidden="true" size={24} strokeWidth={2.2} />,
  },
  DIRECTOR: {
    title: "Espace Direction",
    description: "Entrez le mot de passe d’administration de la Direction pour superviser l’établissement.",
    identifier: "director@demo.intila9a.local",
    icon: <ShieldCheck aria-hidden="true" size={24} strokeWidth={2.2} />,
  },
};

interface CsrfResponse {
  readonly data?: { readonly token?: string };
}

interface LoginResponse {
  readonly data?: {
    readonly user?: unknown;
    readonly token?: string;
  };
  readonly error?: { readonly message?: string };
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

export function PasswordOnlyLogin({ role }: Readonly<{ role: PrivilegedAccessRole }>): ReactNode {
  const profile = accessProfiles[role];
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const csrfToken = await requestCsrfToken();
      const response = await fetch("/api/v1/auth/login", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        body: JSON.stringify({ email: profile.identifier, password }),
      });
      const body = (await response.json()) as LoginResponse;

      if (!response.ok) {
        setError(body.error?.message ?? "Connexion impossible. Réessayez.");
        return;
      }

      const token = body.data?.token;
      if (token && typeof window !== "undefined") {
        try {
          sessionStorage.setItem("intila9a_demo_session", token);
        } catch {
          // Ignore storage restrictions
        }
      }

      const targetBase = role === "TEACHER" ? "/teacher-post" : "/dashboard";
      const targetPath = token
        ? `${targetBase}?auth=${encodeURIComponent(token)}`
        : targetBase;
      window.location.assign(targetPath);
    } catch {
      setError("La connexion sécurisée est indisponible. Réessayez.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="rounded-3xl border border-[var(--line)] bg-white p-6 shadow-[0_20px_60px_rgba(31,68,100,0.12)] sm:p-8" onSubmit={submit}>
      <div className="flex items-start gap-3">
        <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#e3f3f7] text-[var(--brand)]">{profile.icon}</div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--ink)]">{profile.title}</h1>
          <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{profile.description}</p>
        </div>
      </div>

      <label className="mt-7 grid gap-2 text-sm font-semibold text-[var(--ink)]" htmlFor="access-password">
        Mot de passe
        <span className="relative">
          <input
            autoComplete="current-password"
            className="min-h-12 w-full rounded-xl border border-[#bdcad8] bg-white px-4 pr-12 text-base font-normal outline-none transition focus:border-[var(--brand)] focus:ring-4 focus:ring-[#bde5ef]"
            id="access-password"
            onChange={(event) => setPassword(event.target.value)}
            required
            type={showPassword ? "text" : "password"}
            value={password}
          />
          <button
            aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            className="absolute inset-y-0 right-0 grid w-12 place-items-center rounded-r-xl text-[var(--muted)] hover:text-[var(--brand)]"
            onClick={() => setShowPassword((current) => !current)}
            type="button"
          >
            {showPassword ? <EyeOff aria-hidden="true" size={19} /> : <Eye aria-hidden="true" size={19} />}
          </button>
        </span>
      </label>

      {error ? <p aria-live="polite" className="mt-5 rounded-xl bg-[#fff0ee] px-4 py-3 text-sm font-medium text-[var(--danger)]" role="alert">{error}</p> : null}

      <button className="mt-7 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand)] px-5 text-sm font-bold text-white shadow-sm transition hover:bg-[var(--brand-strong)] disabled:cursor-not-allowed disabled:opacity-60" disabled={isSubmitting} type="submit">
        {isSubmitting ? <LoaderCircle aria-hidden="true" className="animate-spin" size={18} /> : null}
        {isSubmitting ? "Connexion sécurisée…" : "Entrer dans mon espace"}
        {!isSubmitting ? <ArrowRight aria-hidden="true" size={18} /> : null}
      </button>
    </form>
  );
}
