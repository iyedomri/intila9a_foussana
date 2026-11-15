import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Intila9a Foussana",
    template: "%s · Intila9a Foussana",
  },
  description: "Private elementary school portal for grades 1 through 6.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>): ReactNode {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
