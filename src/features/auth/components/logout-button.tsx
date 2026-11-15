"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { type ReactNode, useState } from "react";

interface CsrfResponse {
  readonly data?: { readonly token?: string };
}

async function getCsrfToken(): Promise<string> {
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

export function LogoutButton(): ReactNode {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function logout(): Promise<void> {
    setIsLoggingOut(true);

    try {
      const csrfToken = await getCsrfToken();
      await fetch("/api/v1/auth/logout", {
        method: "POST",
        credentials: "same-origin",
        headers: { "X-CSRF-Token": csrfToken },
      });
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  return (
    <button
      className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#c7d3df] bg-white px-4 text-sm font-bold text-[var(--ink)] transition hover:border-[#8ca2b5] disabled:cursor-not-allowed disabled:opacity-60"
      disabled={isLoggingOut}
      onClick={() => void logout()}
      type="button"
    >
      <LogOut aria-hidden="true" size={17} />
      {isLoggingOut ? "Déconnexion…" : "Déconnexion"}
    </button>
  );
}
