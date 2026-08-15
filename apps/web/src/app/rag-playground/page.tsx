import { RagPlayground } from "./rag-playground";

export default function RagPlaygroundPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">RAG playground</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-300">
        One question, run through four interchangeable engines — LangChain, LlamaIndex, the
        Vercel AI SDK, and a hand-rolled implementation — all retrieving from the same pgvector
        store. See <code className="rounded bg-zinc-100 px-1.5 py-0.5 dark:bg-zinc-800">packages/rag-core</code>{" "}
        for the engine implementations.
      </p>
      <RagPlayground />
    </main>
  );
}
