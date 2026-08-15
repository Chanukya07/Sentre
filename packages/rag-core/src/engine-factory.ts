import type { RagEngineName } from "@sentre/shared";
import type { VectorStore } from "./vectordb/interface";
import type { RagEngine } from "./engines/base-engine";
import { CustomEngine } from "./engines/custom-engine";
import { VercelAiEngine } from "./engines/vercel-ai-engine";
import { LangChainEngine } from "./engines/langchain-engine";
import { LlamaIndexEngine } from "./engines/llamaindex-engine";

export interface EngineFactoryConfig {
  vectorStore: VectorStore;
  anthropicApiKey: string;
  voyageApiKey: string;
}

/**
 * Creates a RagEngine by name so callers (API routes, examples) can select
 * an engine via config/env rather than importing a concrete class.
 */
export function createRagEngine(name: RagEngineName, config: EngineFactoryConfig): RagEngine {
  switch (name) {
    case "custom":
      return new CustomEngine(config.vectorStore, config.anthropicApiKey, config.voyageApiKey);
    case "vercel-ai":
      return new VercelAiEngine(config.vectorStore, config.voyageApiKey);
    case "langchain":
      return new LangChainEngine(config.vectorStore, config.anthropicApiKey, config.voyageApiKey);
    case "llamaindex":
      return new LlamaIndexEngine(config.vectorStore, config.anthropicApiKey, config.voyageApiKey);
    default: {
      const exhaustiveCheck: never = name;
      throw new Error(`Unknown RAG engine: ${exhaustiveCheck}`);
    }
  }
}
