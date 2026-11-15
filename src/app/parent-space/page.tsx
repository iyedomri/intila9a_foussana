import type { ReactNode } from "react";

import { ReadOnlyGradePicker } from "@/features/guest/read-only-space";

export const metadata = {
  title: "Espace Parent",
};

export default function ParentSpacePage(): ReactNode {
  return <ReadOnlyGradePicker audience="Parent" />;
}
