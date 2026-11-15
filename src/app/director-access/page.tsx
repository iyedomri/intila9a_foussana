import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { PasswordOnlyLogin } from "@/features/auth/components/password-only-login";

export const metadata = {
  title: "Accès Direction",
};

export default function DirectorAccessPage(): ReactNode {
  return (
    <main className="mx-auto grid min-h-screen max-w-xl place-items-center px-5 py-10">
      <div className="w-full">
        <Link className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-[var(--brand)] underline-offset-4 hover:underline" href="/">
          <ShieldCheck aria-hidden="true" size={18} />
          Choisir un autre espace
        </Link>
        <PasswordOnlyLogin role="DIRECTOR" />
      </div>
    </main>
  );
}
