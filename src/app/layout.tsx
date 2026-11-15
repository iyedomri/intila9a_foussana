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

const perfMeasurePatch = `
(function() {
  function patch(orig) {
    if (typeof orig !== "function") return orig;
    return function(name, startOrOptions, endMark) {
      try {
        if (startOrOptions && typeof startOrOptions === "object") {
          var start = startOrOptions.start;
          var end = startOrOptions.end;
          if ((typeof start === "number" && start < 0) || (typeof end === "number" && end < 0)) {
            startOrOptions = Object.assign({}, startOrOptions, {
              start: typeof start === "number" && start < 0 ? 0 : start,
              end: typeof end === "number" && end < 0 ? 0 : end
            });
          }
        }
        return orig.call(this, name, startOrOptions, endMark);
      } catch (e) {
        // Prevent dev-mode negative timestamp profiling errors from crashing UI
      }
    };
  }
  if (typeof window !== "undefined") {
    if (typeof Performance !== "undefined" && Performance.prototype && Performance.prototype.measure) {
      Performance.prototype.measure = patch(Performance.prototype.measure);
    }
    if (window.performance && window.performance.measure) {
      window.performance.measure = patch(window.performance.measure);
    }
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>): ReactNode {
  return (
    <html lang="fr">
      <head>
        <script
          dangerouslySetInnerHTML={{ __html: perfMeasurePatch }}
          suppressHydrationWarning
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
