import type { RagQuery, RagResponse, RagEngineName } from "@sentre/shared";
import type { VectorStore } from "../vectordb/interface";

/**
 * Every RAG engine implementation (LangChain, LlamaIndex, Vercel AI SDK,
 * custom) conforms to this interface so callers can swap engines without
 * changing calling code — a Strategy pattern over the retrieval+generation
 * pipeline.
 */
export abstract class RagEngine {
  abstract readonly name: RagEngineName;

  constructor(protected readonly vectorStore: VectorStore) {}

  abstract query(input: RagQuery): Promise<RagResponse>;
}

export class RagEngineError extends Error {
  constructor(
    message: string,
    public readonly engine: RagEngineName,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "RagEngineError";
  }
}
