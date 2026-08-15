import Anthropic from "@anthropic-ai/sdk";
import type { RagQuery, RagResponse } from "@sentre/shared";
import { DEFAULT_TOP_K } from "@sentre/shared";
import { RagEngine, RagEngineError } from "./base-engine";
import type { VectorStore } from "../vectordb/interface";
import { embedText } from "../embeddings/voyage-client";
import { buildRagPrompt } from "../prompts/rag-prompt";

/**
 * Hand-rolled RAG pipeline with no orchestration framework: embed the
 * query, retrieve from the vector store, and call the LLM directly.
 * Kept alongside the framework-based engines to demonstrate the mechanics
 * that LangChain/LlamaIndex abstract away.
 */
export class CustomEngine extends RagEngine {
  readonly name = "custom" as const;
  private readonly client: Anthropic;

  constructor(vectorStore: VectorStore, anthropicApiKey: string, private readonly voyageApiKey: string) {
    super(vectorStore);
    this.client = new Anthropic({ apiKey: anthropicApiKey });
  }

  async query(input: RagQuery): Promise<RagResponse> {
    try {
      const queryEmbedding = await embedText(input.question, "query", this.voyageApiKey);
      const chunks = await this.vectorStore.query(queryEmbedding, input.topK ?? DEFAULT_TOP_K, input.filters);

      const response = await this.client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        messages: [{ role: "user", content: buildRagPrompt(input.question, chunks) }],
      });

      const answer = response.content.find((block) => block.type === "text");

      return {
        answer: answer?.type === "text" ? answer.text : "",
        sources: chunks,
        engine: this.name,
      };
    } catch (error) {
      throw new RagEngineError("Custom engine query failed", this.name, error);
    }
  }
}
