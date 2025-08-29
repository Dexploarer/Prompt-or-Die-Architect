import type { Metadata } from "next";
import "./globals.css";
import { Navigation } from "./components/Navigation";

export const metadata: Metadata = {
  title: "Prompt or Die: The Architect",
  description: "AI-powered project planning and code generation platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-neutral-950 text-neutral-100">
        <div className="container mx-auto px-4 py-6">
          <Navigation />
          {children}
        </div>
      </body>
    </html>
  );
}
