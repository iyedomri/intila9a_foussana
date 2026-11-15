import type { ReactNode } from "react";

import { ForgotPasswordForm } from "@/features/auth/components/password-help-forms";

export const metadata = { title: "Mot de passe oublié" };

export default function ForgotPasswordPage(): ReactNode {
  return (
    <main className="mx-auto grid min-h-screen max-w-xl place-items-center px-5 py-10">
      <div className="w-full">
        <p className="mb-5 text-center text-sm font-bold text-[var(--brand)]">Intila9a Foussana</p>
        <ForgotPasswordForm />
      </div>
    </main>
  );
}
