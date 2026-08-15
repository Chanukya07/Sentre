import type { Metadata } from "next";
import { Fraunces } from "next/font/google";
import Link from "next/link";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  axes: ["opsz", "SOFT"],
});

export const metadata: Metadata = {
  title: "Sentre — scents that remember",
  description:
    "A nostalgia-driven fragrance shop. Real customer memories, retrieved and retold as stories by four interchangeable RAG engines.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${fraunces.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <nav className="sticky top-0 z-20 border-b border-line bg-canvas/85 backdrop-blur">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
            <Link href="/" className="font-display text-xl tracking-tight">
              Sentre<span className="text-accent">.</span>
            </Link>
            <div className="flex items-center gap-6 text-sm">
              <Link href="/" className="text-ink-muted transition hover:text-ink">
                Catalog
              </Link>
              <Link href="/chat" className="text-ink-muted transition hover:text-ink">
                Concierge
              </Link>
              <Link
                href="/rag-playground"
                className="rounded-full border border-line bg-surface px-4 py-1.5 text-ink transition hover:border-accent hover:text-accent"
              >
                RAG playground
              </Link>
            </div>
          </div>
        </nav>

        <div className="flex-1">{children}</div>

        <footer className="border-t border-line">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-6 py-8 text-sm text-ink-muted sm:flex-row sm:items-center sm:justify-between">
            <p>
              <span className="font-display text-ink">Sentre</span> — retrieval-grounded storytelling for retail.
            </p>
            <p>Next.js · Neon pgvector · four RAG engines</p>
          </div>
        </footer>
        <SpeedInsights />
      </body>
    </html>
  );
}
