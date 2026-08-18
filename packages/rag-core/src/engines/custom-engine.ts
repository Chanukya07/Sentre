import Anthropic from "@anthropic-ai/sdk";
import type { RagQuery, RagResponse } from "@sentre/shared";
import { DEFAULT_TOP_K } from "@sentre/shared";
import { RagEngine, RagEngineError } from "./base-engine";
import type { VectorStore } from "../vectordb/interface";
import type { LlmConfig } from "../llm/config";
import { chatCompletion } from "../llm/openai-compat";
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

  constructor(
    vectorStore: VectorStore,
    private readonly llm: LlmConfig,
    private readonly voyageApiKey: string,
  ) {
    super(vectorStore);
  }

  private async generate(prompt: string): Promise<string> {
    if (this.llm.provider === "openrouter") {
      return chatCompletion(this.llm, prompt);
    }

    const response = await new Anthropic({ apiKey: this.llm.apiKey }).messages.create({
      model: this.llm.model,
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });
    const answer = response.content.find((block) => block.type === "text");
    return answer?.type === "text" ? answer.text : "";
  }

  async query(input: RagQuery): Promise<RagResponse> {
    try {
      const queryEmbedding = await embedText(input.question, "query", this.voyageApiKey);
      const chunks = await this.vectorStore.query(queryEmbedding, input.topK ?? DEFAULT_TOP_K, input.filters);

      return {
        answer: await this.generate(buildRagPrompt(input.question, chunks)),
        sources: chunks,
        engine: this.name,
      };
    } catch (error) {
      throw new RagEngineError("Custom engine query failed", this.name, error);
    }
  }
}
