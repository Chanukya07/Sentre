import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText, type LanguageModel } from "ai";
import type { RagQuery, RagResponse } from "@sentre/shared";
import { DEFAULT_TOP_K } from "@sentre/shared";
import { RagEngine, RagEngineError } from "./base-engine";
import type { VectorStore } from "../vectordb/interface";
import type { LlmConfig } from "../llm/config";
import { embedText } from "../embeddings/voyage-client";
import { buildRagPrompt } from "../prompts/rag-prompt";

/**
 * Vercel AI SDK engine. Preferred for the deployed web app's chat routes
 * since `streamText`/`generateText` integrate directly with Next.js Route
 * Handlers and React Server Components with minimal glue code.
 */
export class VercelAiEngine extends RagEngine {
  readonly name = "vercel-ai" as const;
  private readonly model: LanguageModel;

  constructor(
    vectorStore: VectorStore,
    llm: LlmConfig,
    private readonly voyageApiKey: string,
  ) {
    super(vectorStore);
    this.model = createLanguageModel(llm);
  }

  async query(input: RagQuery): Promise<RagResponse> {
    try {
      const queryEmbedding = await embedText(input.question, "query", this.voyageApiKey);
      const chunks = await this.vectorStore.query(queryEmbedding, input.topK ?? DEFAULT_TOP_K, input.filters);

      const { text } = await generateText({
        model: this.model,
        prompt: buildRagPrompt(input.question, chunks),
      });

      return { answer: text, sources: chunks, engine: this.name };
    } catch (error) {
      throw new RagEngineError("Vercel AI engine query failed", this.name, error);
    }
  }
}

/**
 * OpenRouter speaks the OpenAI wire format, so it plugs into the AI SDK's
 * OpenAI provider with only a baseURL override.
 */
export function createLanguageModel(llm: LlmConfig): LanguageModel {
  if (llm.provider === "openrouter") {
    return createOpenAI({ apiKey: llm.apiKey, baseURL: llm.baseUrl })(llm.model);
  }
  return createAnthropic({ apiKey: llm.apiKey })(llm.model);
}
