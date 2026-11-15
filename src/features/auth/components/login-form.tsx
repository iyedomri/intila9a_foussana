"use client";

import { ArrowRight, Eye, EyeOff, LoaderCircle, ShieldCheck } from "lucide-react";
import { type FormEvent, type ReactNode, useState } from "react";

interface DemoCredential {
  readonly label: string;
  readonly email: string;
  readonly password: string;
  readonly description: string;
}

const demoCredentials: readonly DemoCredential[] = [
  {
    label: "Direction",
    email: "director@demo.intila9a.local",
    password: "Demo!Director2026",
    description: "Gestion, modération et journal d’audit",
  },
  {
    label: "Enseignant",
    email: "teacher@demo.intila9a.local",
    password: "Demo!Teacher2026",
    description: "Publications et contenus de ses classes",
  },
];

interface CsrfResponse {
  readonly data?: {
    readonly token?: string;
  };
}

interface LoginResponse {
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
  const token = body.data?.token;

  if (!response.ok || !token) {
    throw new Error("CSRF_BOOTSTRAP_FAILED");
  }

  return token;
}

export function LoginForm(): ReactNode {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function useDemoCredential(credential: DemoCredential): void {
    setEmail(credential.email);
    setPassword(credential.password);
    setError(null);
  }

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
        setError(body.error?.message ?? "Connexion impossible. Réessayez.");
        return;
      }

      window.location.assign("/dashboard");
    } catch {
      setError("La connexion sécurisée est indisponible. Réessayez.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <form
        className="rounded-3xl border border-[var(--line)] bg-white p-6 shadow-[0_20px_60px_rgba(31,68,100,0.12)] sm:p-8"
        onSubmit={handleSubmit}
      >
        <div className="mb-7 flex items-start gap-3">
          <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#e3f3f7] text-[var(--brand)]">
            <ShieldCheck aria-hidden="true" size={24} strokeWidth={2.2} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--ink)]">Bienvenue</h1>
            <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
              Connectez-vous pour accéder à votre espace privé.
            </p>
          </div>
        </div>

        <div className="space-y-5">
          <label className="grid gap-2 text-sm font-semibold text-[var(--ink)]" htmlFor="email">
            Adresse e-mail
            <input
              autoComplete="email"
              className="min-h-12 rounded-xl border border-[#bdcad8] bg-white px-4 text-base font-normal outline-none transition placeholder:text-[#8190a3] focus:border-[var(--brand)] focus:ring-4 focus:ring-[#bde5ef]"
              id="email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="nom@ecole.tn"
              required
              type="email"
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

      <aside aria-label="Comptes de démonstration" className="rounded-3xl border border-[#cce7ef] bg-[#edf8fb] p-5 sm:p-6">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#38718a]">Aperçu local</p>
        <h2 className="mt-2 text-xl font-bold tracking-tight text-[var(--ink)]">Tester les accès sécurisés</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          Ces comptes sont uniquement disponibles dans le serveur local de démonstration.
        </p>
        <div className="mt-5 grid gap-3">
          {demoCredentials.map((credential) => (
            <button
              className="rounded-2xl border border-[#cae3eb] bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-[#87c7d9] hover:shadow-sm"
              key={credential.email}
              onClick={() => useDemoCredential(credential)}
              type="button"
            >
              <span className="block text-sm font-bold text-[var(--ink)]">{credential.label}</span>
              <span className="mt-1 block text-xs leading-5 text-[var(--muted)]">{credential.description}</span>
            </button>
          ))}
        </div>
      </aside>
    </div>
  );
}
