import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Prompt-or-Die Planner",
  description: "AI planning and document generation",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Glass AI Diagrams",
  description: "AI-assisted architecture diagrams and planning",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}


