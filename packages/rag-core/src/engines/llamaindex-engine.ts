import { Anthropic as LlamaIndexAnthropic } from "@llamaindex/anthropic";
import { OpenAI as LlamaIndexOpenAI } from "@llamaindex/openai";
import type { RagQuery, RagResponse } from "@sentre/shared";
import { DEFAULT_TOP_K } from "@sentre/shared";
import { RagEngine, RagEngineError } from "./base-engine";
import type { VectorStore } from "../vectordb/interface";
import type { LlmConfig } from "../llm/config";
import { embedText } from "../embeddings/voyage-client";
import { buildRagPrompt } from "../prompts/rag-prompt";

interface CompletingLlm {
  complete(params: { prompt: string }): Promise<{ text: string }>;
}

/**
 * LlamaIndex engine. Uses LlamaIndex's LLM wrapper for generation while
 * retrieval goes through our shared VectorStore, for the same reason as
 * the LangChain engine — an apples-to-apples comparison of just the
 * generation/orchestration layer.
 */
export class LlamaIndexEngine extends RagEngine {
  readonly name = "llamaindex" as const;
  private readonly llmClient: CompletingLlm;

  constructor(
    vectorStore: VectorStore,
    llm: LlmConfig,
    private readonly voyageApiKey: string,
  ) {
    super(vectorStore);
    this.llmClient =
      llm.provider === "openrouter"
        ? (new LlamaIndexOpenAI({
            model: llm.model,
            apiKey: llm.apiKey,
            additionalSessionOptions: { baseURL: llm.baseUrl },
          }) as unknown as CompletingLlm)
        : (new LlamaIndexAnthropic({ model: llm.model, apiKey: llm.apiKey }) as unknown as CompletingLlm);
  }

  async query(input: RagQuery): Promise<RagResponse> {
    try {
      const queryEmbedding = await embedText(input.question, "query", this.voyageApiKey);
      const chunks = await this.vectorStore.query(queryEmbedding, input.topK ?? DEFAULT_TOP_K, input.filters);

      const response = await this.llmClient.complete({ prompt: buildRagPrompt(input.question, chunks) });

      return { answer: response.text, sources: chunks, engine: this.name };
    } catch (error) {
      throw new RagEngineError("LlamaIndex engine query failed", this.name, error);
    }
  }
}
