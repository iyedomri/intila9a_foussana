import type { ReactNode } from "react";

import { ReadOnlySpace } from "@/features/guest/read-only-space";

export const metadata = {
  title: "Espace Parent",
};

export default function ParentSpacePage(): ReactNode {
  return <ReadOnlySpace audience="Parent" />;
}
