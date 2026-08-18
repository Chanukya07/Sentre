import type { RagEngineName } from "@sentre/shared";
import type { VectorStore } from "./vectordb/interface";
import type { RagEngine } from "./engines/base-engine";
import type { LlmConfig } from "./llm/config";
import { CustomEngine } from "./engines/custom-engine";
import { VercelAiEngine } from "./engines/vercel-ai-engine";
import { LangChainEngine } from "./engines/langchain-engine";
import { LlamaIndexEngine } from "./engines/llamaindex-engine";

export interface EngineFactoryConfig {
  vectorStore: VectorStore;
  /** Which LLM backs generation — see resolveLlmConfig(). */
  llm: LlmConfig;
  voyageApiKey: string;
}

/**
 * Creates a RagEngine by name so callers (API routes, examples) can select
 * an engine via config/env rather than importing a concrete class.
 */
export function createRagEngine(name: RagEngineName, config: EngineFactoryConfig): RagEngine {
  const { vectorStore, llm, voyageApiKey } = config;

  switch (name) {
    case "custom":
      return new CustomEngine(vectorStore, llm, voyageApiKey);
    case "vercel-ai":
      return new VercelAiEngine(vectorStore, llm, voyageApiKey);
    case "langchain":
      return new LangChainEngine(vectorStore, llm, voyageApiKey);
    case "llamaindex":
      return new LlamaIndexEngine(vectorStore, llm, voyageApiKey);
    default: {
      const exhaustiveCheck: never = name;
      throw new Error(`Unknown RAG engine: ${exhaustiveCheck}`);
    }
  }
}
