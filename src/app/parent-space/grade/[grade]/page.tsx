import type { ReactNode } from "react";

import { ReadOnlyGradeFeed } from "@/features/guest/read-only-space";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Publications de classe",
};

export default async function ParentGradePage({
  params,
}: Readonly<{ params: Promise<{ grade: string }> }>): Promise<ReactNode> {
  const { grade } = await params;
  return <ReadOnlyGradeFeed audience="Parent" gradeValue={grade} />;
}
