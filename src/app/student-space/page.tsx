import type { ReactNode } from "react";

import { ReadOnlySpace } from "@/features/guest/read-only-space";

export const metadata = {
  title: "Espace Élève",
};

export default function StudentSpacePage(): ReactNode {
  return <ReadOnlySpace audience="Élève" />;
}
