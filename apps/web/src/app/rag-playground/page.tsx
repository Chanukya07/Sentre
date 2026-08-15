import { RagPlayground } from "./rag-playground";

export default function RagPlaygroundPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-14">
      <p className="text-sm uppercase tracking-[0.25em] text-accent">Under the hood</p>
      <h1 className="mt-3 font-display text-4xl tracking-tight">RAG playground</h1>
      <p className="mt-4 leading-relaxed text-ink-muted">
        One question, four interchangeable engines — LangChain, LlamaIndex, the Vercel AI SDK, and a
        hand-rolled implementation — all retrieving from the same pgvector store, so only the
        generation layer differs. The implementations live in{" "}
        <code className="rounded bg-accent-soft px-1.5 py-0.5 text-sm text-accent-strong">
          packages/rag-core
        </code>
        .
      </p>
      <RagPlayground />
    </main>
  );
}
