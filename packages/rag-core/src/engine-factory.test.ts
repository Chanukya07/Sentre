import { describe, expect, it } from "vitest";
import { RAG_ENGINES } from "@sentre/shared";
import type { RagEngineName } from "@sentre/shared";
import { createRagEngine } from "./engine-factory";
import { InMemoryVectorStore } from "./vectordb/implementations/in-memory-store";

const config = {
  vectorStore: new InMemoryVectorStore(),
  anthropicApiKey: "test-anthropic-key",
  voyageApiKey: "test-voyage-key",
};

describe("createRagEngine", () => {
  it.each(RAG_ENGINES)("builds the %s engine and tags it with its own name", (name) => {
    expect(createRagEngine(name, config).name).toBe(name);
  });

  it("covers every engine in RAG_ENGINES, so the UI's dropdown can't offer an unbuildable engine", () => {
    for (const name of RAG_ENGINES) {
      expect(() => createRagEngine(name, config)).not.toThrow();
    }
  });

  it("throws on an unknown engine name rather than silently defaulting", () => {
    expect(() => createRagEngine("gpt-vibes" as RagEngineName, config)).toThrow(/unknown rag engine/i);
  });
});
