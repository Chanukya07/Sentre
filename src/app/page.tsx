export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center gap-8 px-6 py-12">
      <h1 className="text-4xl font-semibold tracking-tight">Sentre</h1>
      <p className="text-zinc-600 dark:text-zinc-300">
        Phase 0 scaffold is live. Use{" "}
        <code className="rounded bg-zinc-100 px-1.5 py-0.5 dark:bg-zinc-800">
          /api/health
        </code>{" "}
        to verify app + Neon connectivity.
      </p>
      <ul className="list-disc space-y-2 pl-6 text-zinc-700 dark:text-zinc-200">
        <li>Next.js 15 + TypeScript + Tailwind app shell</li>
        <li>Neon + Drizzle schema foundation with pgvector support</li>
        <li>Offline Python scripts for synthetic data, ABSA, and indexing</li>
      </ul>
    </main>
  );
}
