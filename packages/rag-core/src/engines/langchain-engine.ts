import { ChatAnthropic } from "@langchain/anthropic";
import { ChatOpenAI } from "@langchain/openai";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { HumanMessage } from "@langchain/core/messages";
import type { RagQuery, RagResponse } from "@sentre/shared";
import { DEFAULT_TOP_K } from "@sentre/shared";
import { RagEngine, RagEngineError } from "./base-engine";
import type { VectorStore } from "../vectordb/interface";
import type { LlmConfig } from "../llm/config";
import { embedText } from "../embeddings/voyage-client";
import { buildRagPrompt } from "../prompts/rag-prompt";

/**
 * LangChain engine. Retrieval still goes through our own VectorStore
 * abstraction (rather than a `langchain` VectorStore subclass) so all four
 * engines share one retrieval path and only the generation/orchestration
 * layer differs — the fair basis for comparing frameworks.
 */
export class LangChainEngine extends RagEngine {
  readonly name = "langchain" as const;
  private readonly model: BaseChatModel;

  constructor(
    vectorStore: VectorStore,
    llm: LlmConfig,
    private readonly voyageApiKey: string,
  ) {
    super(vectorStore);
    this.model =
      llm.provider === "openrouter"
        ? new ChatOpenAI({
            model: llm.model,
            apiKey: llm.apiKey,
            configuration: { baseURL: llm.baseUrl },
          })
        : new ChatAnthropic({ model: llm.model, apiKey: llm.apiKey });
  }

  async query(input: RagQuery): Promise<RagResponse> {
    try {
      const queryEmbedding = await embedText(input.question, "query", this.voyageApiKey);
      const chunks = await this.vectorStore.query(queryEmbedding, input.topK ?? DEFAULT_TOP_K, input.filters);

      const result = await this.model.invoke([new HumanMessage(buildRagPrompt(input.question, chunks))]);

      return {
        answer: typeof result.content === "string" ? result.content : JSON.stringify(result.content),
        sources: chunks,
        engine: this.name,
      };
    } catch (error) {
      throw new RagEngineError("LangChain engine query failed", this.name, error);
    }
  }
}
