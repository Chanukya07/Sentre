/**
 * End-to-end smoke test: proves the AI pipeline actually works against real
 * services. Unlike the unit tests (which mock every network call), this makes
 * genuine requests, so it is the only thing that can answer "is the AI
 * working?".
 *
 *   npm run smoke
 *
 * Each stage reports independently, and a failure in one does not hide the
 * others — so a bad Voyage key doesn't masquerade as a broken LLM.
 */
import { sql } from "drizzle-orm";
import {
  PgVectorStore,
  createRagEngine,
  embedText,
  resolveLlmConfig,
  type LlmConfig,
} from "@sentre/rag-core";
import type { RagEngineName } from "@sentre/shared";
import { getDb } from "../src/db";

type Stage = { name: string; ok: boolean; detail: string };
const results: Stage[] = [];

async function stage(name: string, fn: () => Promise<string>): Promise<boolean> {
  // Show which stage is in flight (network calls are slow), then clear the
  // line so the result replaces it. Only on a TTY — carriage returns don't
  // reposition in piped output, which would garble CI logs.
  const interactive = process.stdout.isTTY === true;
  if (interactive) process.stdout.write(`… ${name}`);
  const clearLine = () => {
    if (interactive) process.stdout.write(`\r${" ".repeat(name.length + 4)}\r`);
  };
  try {
    const detail = await fn();
    clearLine();
    results.push({ name, ok: true, detail });
    console.log(`✓ ${name} — ${detail}`);
    return true;
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    clearLine();
    results.push({ name, ok: false, detail });
    console.log(`✗ ${name} — ${detail}`);
    return false;
  }
}

async function main() {
  console.log("Sentre smoke test — real network calls, no mocks\n");

  let llm: LlmConfig | null = null;
  const configOk = await stage("LLM config resolves", async () => {
    llm = resolveLlmConfig();
    return `provider=${llm.provider} model=${llm.model}`;
  });

  const voyageApiKey = process.env.VOYAGE_API_KEY;
  const embeddingOk = await stage("Voyage embeddings reachable", async () => {
    if (!voyageApiKey) throw new Error("VOYAGE_API_KEY is not set");
    const vector = await embedText("a nostalgic amber fragrance", "query", voyageApiKey);
    if (vector.length !== 1024) {
      throw new Error(`expected 1024 dimensions, got ${vector.length} — schema expects vector(1024)`);
    }
    return `${vector.length} dimensions`;
  });

  let dbOk = false;
  let productCount = 0;
  let embeddingCount = 0;
  dbOk = await stage("Database reachable", async () => {
    const db = getDb();
    const products = await db.execute<{ count: string }>(sql`SELECT count(*) AS count FROM products`);
    const embeddings = await db.execute<{ count: string }>(
      sql`SELECT count(*) AS count FROM embeddings WHERE embedding IS NOT NULL`,
    );
    productCount = Number(products.rows[0]?.count ?? 0);
    embeddingCount = Number(embeddings.rows[0]?.count ?? 0);
    return `${productCount} products, ${embeddingCount} embeddings`;
  });

  if (dbOk && embeddingCount === 0) {
    console.log("  ↳ catalog is empty — run `npm run db:seed` before the RAG stage can retrieve anything");
  }

  // The real prize: one full question through the pipeline — embed, retrieve
  // from pgvector, generate. This is what the deployed app does per request.
  if (configOk && embeddingOk && dbOk && embeddingCount > 0 && llm && voyageApiKey) {
    const engineName = (process.env.DEFAULT_RAG_ENGINE as RagEngineName | undefined) ?? "vercel-ai";
    await stage(`End-to-end RAG query (${engineName})`, async () => {
      const engine = createRagEngine(engineName, {
        vectorStore: new PgVectorStore(getDb()),
        llm: llm!,
        voyageApiKey: voyageApiKey!,
      });
      const response = await engine.query({ question: "Which fragrance feels nostalgic?", topK: 3 });
      if (!response.answer.trim()) throw new Error("model returned an empty answer");
      console.log(`\n  answer: ${response.answer.trim().slice(0, 200)}…`);
      console.log(`  grounded in ${response.sources.length} source(s)\n`);
      return `${response.answer.length} chars from ${response.sources.length} sources`;
    });
  } else {
    console.log("⊘ End-to-end RAG query — skipped (needs the stages above to pass with a seeded catalog)");
  }

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} stages passed`);
  if (failed.length > 0) {
    console.log("\nThe AI is NOT fully working. Fix in this order:");
    for (const f of failed) console.log(`  - ${f.name}: ${f.detail}`);
    process.exit(1);
  }
  console.log("The AI pipeline is working end to end.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
