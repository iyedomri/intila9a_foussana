"use client";

import { ArrowRight, Eye, EyeOff, LoaderCircle, ShieldCheck } from "lucide-react";
import { type FormEvent, type ReactNode, useState } from "react";

interface CsrfResponse {
  readonly data?: {
    readonly token?: string;
  };
}

interface LoginResponse {
  readonly data?: {
    readonly user?: unknown;
    readonly token?: string;
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

export function LoginForm(): ReactNode {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
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
        body: JSON.stringify({ email, password }),
      });
      const body = (await response.json()) as LoginResponse;

      if (!response.ok) {
        setError(body.error?.message ?? "Les identifiants transmis ne permettent pas de vous connecter.");
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

      const targetPath = token
        ? `/dashboard?auth=${encodeURIComponent(token)}`
        : "/dashboard";
      window.location.assign(targetPath);
    } catch {
      setError("La connexion sécurisée est indisponible. Réessayez.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-lg">
      <form
        className="rounded-3xl border border-[var(--line)] bg-white p-6 shadow-[0_20px_60px_rgba(31,68,100,0.12)] sm:p-8"
        onSubmit={handleSubmit}
      >
        <div className="mb-7 flex items-start gap-3">
          <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#e3f3f7] text-[var(--brand)]">
            <ShieldCheck aria-hidden="true" size={24} strokeWidth={2.2} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--ink)]">Connexion sécurisée</h1>
            <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
              Accédez à votre espace Intila9a Foussana.
            </p>
          </div>
        </div>

        <div className="space-y-5">
          <label className="grid gap-2 text-sm font-semibold text-[var(--ink)]" htmlFor="email">
            Adresse e-mail ou identifiant
            <input
              autoComplete="email"
              className="min-h-12 rounded-xl border border-[#bdcad8] bg-white px-4 text-base font-normal outline-none transition placeholder:text-[#8190a3] focus:border-[var(--brand)] focus:ring-4 focus:ring-[#bde5ef]"
              id="email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="directeur@ecole-foussana.tn ou enseignant@..."
              required
              type="text"
              value={email}
            />
          </label>

          <label className="grid gap-2 text-sm font-semibold text-[var(--ink)]" htmlFor="password">
            Mot de passe
            <span className="relative">
              <input
                autoComplete="current-password"
                className="min-h-12 w-full rounded-xl border border-[#bdcad8] bg-white px-4 pr-12 text-base font-normal outline-none transition placeholder:text-[#8190a3] focus:border-[var(--brand)] focus:ring-4 focus:ring-[#bde5ef]"
                id="password"
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
        </div>

        {error ? (
          <p aria-live="polite" className="mt-5 rounded-xl bg-[#fff0ee] px-4 py-3 text-sm font-medium text-[var(--danger)]" role="alert">
            {error}
          </p>
        ) : null}

        <button
          className="mt-7 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand)] px-5 text-sm font-bold text-white shadow-sm transition hover:bg-[var(--brand-strong)] disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? <LoaderCircle aria-hidden="true" className="animate-spin" size={18} /> : null}
          {isSubmitting ? "Connexion sécurisée…" : "Se connecter"}
          {!isSubmitting ? <ArrowRight aria-hidden="true" size={18} /> : null}
        </button>

        <a className="mt-5 block text-center text-sm font-semibold text-[var(--brand)] underline-offset-4 hover:underline" href="/forgot-password">
          Mot de passe oublié ?
        </a>
      </form>
    </div>
  );
}
