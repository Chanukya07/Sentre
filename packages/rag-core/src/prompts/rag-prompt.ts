import type { RetrievedChunk } from "@sentre/shared";

export function buildRagPrompt(question: string, chunks: RetrievedChunk[]): string {
  const context = chunks
    .map((chunk, i) => `[${i + 1}] (score: ${chunk.score.toFixed(3)}) ${chunk.text}`)
    .join("\n\n");

  return `You are Sentre's product assistant. Answer the question using only the context below. Cite sources by their [n] index. If the context doesn't contain the answer, say so.

Context:
${context}

Question: ${question}`;
}
