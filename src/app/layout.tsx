import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Glass AI Diagrams",
  description: "AI-assisted architecture diagrams and planning",
};

import { Providers } from "./components/Providers";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}


