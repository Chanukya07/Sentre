import { ChatAnthropic } from "@langchain/anthropic";
import { HumanMessage } from "@langchain/core/messages";
import type { RagQuery, RagResponse } from "@sentre/shared";
import { DEFAULT_TOP_K } from "@sentre/shared";
import { RagEngine, RagEngineError } from "./base-engine";
import type { VectorStore } from "../vectordb/interface";
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
  private readonly model: ChatAnthropic;

  constructor(vectorStore: VectorStore, anthropicApiKey: string, private readonly voyageApiKey: string) {
    super(vectorStore);
    this.model = new ChatAnthropic({
      model: "claude-haiku-4-5-20251001",
      apiKey: anthropicApiKey,
    });
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
