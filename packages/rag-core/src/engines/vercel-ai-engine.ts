import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";
import type { RagQuery, RagResponse } from "@sentre/shared";
import { DEFAULT_TOP_K } from "@sentre/shared";
import { RagEngine, RagEngineError } from "./base-engine";
import type { VectorStore } from "../vectordb/interface";
import { embedText } from "../embeddings/voyage-client";
import { buildRagPrompt } from "../prompts/rag-prompt";

/**
 * Vercel AI SDK engine. Preferred for the deployed web app's chat routes
 * since `streamText`/`generateText` integrate directly with Next.js Route
 * Handlers and React Server Components with minimal glue code.
 */
export class VercelAiEngine extends RagEngine {
  readonly name = "vercel-ai" as const;

  constructor(vectorStore: VectorStore, private readonly voyageApiKey: string) {
    super(vectorStore);
  }

  async query(input: RagQuery): Promise<RagResponse> {
    try {
      const queryEmbedding = await embedText(input.question, "query", this.voyageApiKey);
      const chunks = await this.vectorStore.query(queryEmbedding, input.topK ?? DEFAULT_TOP_K, input.filters);

      const { text } = await generateText({
        model: anthropic("claude-haiku-4-5-20251001"),
        prompt: buildRagPrompt(input.question, chunks),
      });

      return { answer: text, sources: chunks, engine: this.name };
    } catch (error) {
      throw new RagEngineError("Vercel AI engine query failed", this.name, error);
    }
  }
}
