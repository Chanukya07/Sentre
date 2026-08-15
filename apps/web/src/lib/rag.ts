import { PgVectorStore, createRagEngine } from "@sentre/rag-core";
import type { RagEngineName } from "@sentre/shared";
import { getDb } from "@/db";

/**
 * Builds a RagEngine for the given engine name (or DEFAULT_RAG_ENGINE from
 * env) against the real pgvector store, so any API route can swap engines
 * via a query param or env var without touching route logic.
 */
export function buildRagEngine(engineName?: RagEngineName) {
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
  const voyageApiKey = process.env.VOYAGE_API_KEY;

  if (!anthropicApiKey) throw new Error("ANTHROPIC_API_KEY is not set");
  if (!voyageApiKey) throw new Error("VOYAGE_API_KEY is not set");

  const name = engineName ?? (process.env.DEFAULT_RAG_ENGINE as RagEngineName | undefined) ?? "vercel-ai";
  const vectorStore = new PgVectorStore(getDb());

  return createRagEngine(name, { vectorStore, anthropicApiKey, voyageApiKey });
}
