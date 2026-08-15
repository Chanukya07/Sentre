/**
 * Run with: npx tsx packages/rag-core/examples/compare-engines.ts
 *
 * Loads a handful of product descriptions into an in-memory vector store
 * and runs the same question through all four engines, so you can see
 * the framework differences with zero database setup.
 *
 * Requires ANTHROPIC_API_KEY and VOYAGE_API_KEY in the environment.
 */
import { InMemoryVectorStore } from "../src/vectordb/implementations/in-memory-store";
import { embedText } from "../src/embeddings/voyage-client";
import { createRagEngine } from "../src/engine-factory";
import type { RagEngineName } from "@sentre/shared";

const SAMPLE_PRODUCTS = [
  { id: "1", text: "Velvet Dusk is a warm amber and vanilla fragrance evoking 1970s evenings, with notes of sandalwood and smoked oud." },
  { id: "2", text: "Citrus Verbena is a bright, aspirational scent for mornings, blending grapefruit, verbena, and white tea." },
  { id: "3", text: "Rainwood is a nostalgic forest-walk fragrance with notes of petrichor, cedar, and moss, reminiscent of childhood summers." },
];

async function main() {
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
  const voyageApiKey = process.env.VOYAGE_API_KEY;
  if (!anthropicApiKey || !voyageApiKey) {
    throw new Error("Set ANTHROPIC_API_KEY and VOYAGE_API_KEY to run this example.");
  }

  const vectorStore = new InMemoryVectorStore();
  for (const product of SAMPLE_PRODUCTS) {
    const values = await embedText(product.text, "document", voyageApiKey);
    await vectorStore.upsert([{ id: product.id, values, metadata: { text: product.text, sourceType: "product" } }]);
  }

  const question = "Which fragrance feels nostalgic and earthy?";
  const engines: RagEngineName[] = ["custom", "vercel-ai", "langchain", "llamaindex"];

  for (const engineName of engines) {
    const engine = createRagEngine(engineName, { vectorStore, anthropicApiKey, voyageApiKey });
    const response = await engine.query({ question });
    console.log(`\n=== ${engineName} ===`);
    console.log(response.answer);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
