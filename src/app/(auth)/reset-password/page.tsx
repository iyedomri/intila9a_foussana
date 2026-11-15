import { Suspense } from "react";
import type { ReactNode } from "react";

import { ResetPasswordForm } from "@/features/auth/components/password-help-forms";

export const metadata = { title: "Nouveau mot de passe" };

export default function ResetPasswordPage(): ReactNode {
  return (
    <main className="mx-auto grid min-h-screen max-w-xl place-items-center px-5 py-10">
      <div className="w-full">
        <p className="mb-5 text-center text-sm font-bold text-[var(--brand)]">Intila9a Foussana</p>
        <Suspense fallback={<div className="rounded-3xl bg-white p-8 text-center text-sm text-[var(--muted)]">Chargement sécurisé…</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </main>
  );
}
