import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sentre",
  description: "AI retail assistant with RAG and sentiment-aware responses.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <nav className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <div className="mx-auto flex w-full max-w-5xl items-center gap-6 text-sm">
            <Link href="/" className="font-semibold">
              Sentre
            </Link>
            <Link href="/rag-playground" className="text-zinc-600 hover:underline dark:text-zinc-400">
              RAG playground
            </Link>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
