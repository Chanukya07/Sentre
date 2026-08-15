import { Anthropic as LlamaIndexAnthropic } from "@llamaindex/anthropic";
import type { RagQuery, RagResponse } from "@sentre/shared";
import { DEFAULT_TOP_K } from "@sentre/shared";
import { RagEngine, RagEngineError } from "./base-engine";
import type { VectorStore } from "../vectordb/interface";
import { embedText } from "../embeddings/voyage-client";
import { buildRagPrompt } from "../prompts/rag-prompt";

/**
 * LlamaIndex engine. Uses LlamaIndex's LLM wrapper for generation while
 * retrieval goes through our shared VectorStore, for the same reason as
 * the LangChain engine — an apples-to-apples comparison of just the
 * generation/orchestration layer.
 */
export class LlamaIndexEngine extends RagEngine {
  readonly name = "llamaindex" as const;
  private readonly llm: LlamaIndexAnthropic;

  constructor(vectorStore: VectorStore, anthropicApiKey: string, private readonly voyageApiKey: string) {
    super(vectorStore);
    this.llm = new LlamaIndexAnthropic({
      model: "claude-haiku-4-5-20251001",
      apiKey: anthropicApiKey,
    });
  }

  async query(input: RagQuery): Promise<RagResponse> {
    try {
      const queryEmbedding = await embedText(input.question, "query", this.voyageApiKey);
      const chunks = await this.vectorStore.query(queryEmbedding, input.topK ?? DEFAULT_TOP_K, input.filters);

      const response = await this.llm.complete({ prompt: buildRagPrompt(input.question, chunks) });

      return { answer: response.text, sources: chunks, engine: this.name };
    } catch (error) {
      throw new RagEngineError("LlamaIndex engine query failed", this.name, error);
    }
  }
}
