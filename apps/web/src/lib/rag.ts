import { PgVectorStore, createRagEngine, resolveLlmConfig } from "@sentre/rag-core";
import type { RagEngineName } from "@sentre/shared";
import { getDb } from "@/db";

export function getVoyageApiKey(): string {
  const voyageApiKey = process.env.VOYAGE_API_KEY;
  if (!voyageApiKey) throw new Error("VOYAGE_API_KEY is not set");
  return voyageApiKey;
}

/**
 * Builds a RagEngine for the given engine name (or DEFAULT_RAG_ENGINE from
 * env) against the real pgvector store, so any API route can swap engines
 * via a query param or env var without touching route logic. The LLM behind
 * generation is chosen separately by LLM_PROVIDER (anthropic | openrouter).
 */
export function buildRagEngine(engineName?: RagEngineName) {
  const name = engineName ?? (process.env.DEFAULT_RAG_ENGINE as RagEngineName | undefined) ?? "vercel-ai";

  return createRagEngine(name, {
    vectorStore: new PgVectorStore(getDb()),
    llm: resolveLlmConfig(),
    voyageApiKey: getVoyageApiKey(),
  });
}
