import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: "Creator Manager",
  description: "Your AI sales team for brand deals — find, pitch, propose, follow up, and book, all in your own voice.",
};

// Runs before paint so a saved dark-mode choice doesn't flash light first.
// Light is the true default — this only ever needs to switch TO dark.
const THEME_INIT_SCRIPT = `
try {
  if (localStorage.getItem('theme') === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
} catch (e) {}
`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        </head>
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
