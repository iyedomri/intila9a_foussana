import type { ReactNode } from "react";

import { ReadOnlyGradePicker } from "@/features/guest/read-only-space";

export const metadata = {
  title: "Espace Élève",
};

export default function StudentSpacePage(): ReactNode {
  return <ReadOnlyGradePicker audience="Élève" />;
}
