import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockCreate, mockEmbedText } = vi.hoisted(() => ({
  mockCreate: vi.fn(),
  mockEmbedText: vi.fn(),
}));

vi.mock("@anthropic-ai/sdk", () => ({
  default: vi.fn(() => ({ messages: { create: mockCreate } })),
}));

vi.mock("../embeddings/voyage-client", () => ({ embedText: mockEmbedText }));

import { CustomEngine } from "./custom-engine";
import { RagEngineError } from "./base-engine";
import { InMemoryVectorStore } from "../vectordb/implementations/in-memory-store";

const ANTHROPIC_LLM = {
  provider: "anthropic" as const,
  apiKey: "anthropic-key",
  model: "claude-haiku-4-5-20251001",
};

async function seededStore() {
  const store = new InMemoryVectorStore();
  await store.upsert([
    { id: "r1", values: [1, 0], metadata: { text: "reminds me of summers in 1987" } },
    { id: "r2", values: [0, 1], metadata: { text: "the bottle is a nice shape" } },
  ]);
  return store;
}

describe("CustomEngine", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEmbedText.mockResolvedValue([1, 0]);
    mockCreate.mockResolvedValue({ content: [{ type: "text", text: "It's the 1987 one." }] });
  });

  it("embeds the question as a query, not a document", async () => {
    // Voyage returns different vectors per input_type; embedding a question as
    // "document" silently degrades retrieval instead of failing loudly.
    const engine = new CustomEngine(await seededStore(), ANTHROPIC_LLM, "voyage-key");

    await engine.query({ question: "which is nostalgic?" });

    expect(mockEmbedText).toHaveBeenCalledWith("which is nostalgic?", "query", "voyage-key");
  });

  it("returns the retrieved chunks as sources alongside the answer", async () => {
    const engine = new CustomEngine(await seededStore(), ANTHROPIC_LLM, "voyage-key");

    const response = await engine.query({ question: "which is nostalgic?", topK: 1 });

    expect(response.answer).toBe("It's the 1987 one.");
    expect(response.engine).toBe("custom");
    expect(response.sources).toHaveLength(1);
    expect(response.sources[0]?.text).toBe("reminds me of summers in 1987");
  });

  it("grounds the LLM call in the retrieved text", async () => {
    const engine = new CustomEngine(await seededStore(), ANTHROPIC_LLM, "voyage-key");

    await engine.query({ question: "which is nostalgic?", topK: 1 });

    const prompt = mockCreate.mock.calls[0]?.[0].messages[0].content;
    expect(prompt).toContain("reminds me of summers in 1987");
    expect(prompt).toContain("which is nostalgic?");
  });

  it("wraps downstream failures in RagEngineError tagged with the engine", async () => {
    mockEmbedText.mockRejectedValue(new Error("voyage is down"));
    const engine = new CustomEngine(await seededStore(), ANTHROPIC_LLM, "voyage-key");

    await expect(engine.query({ question: "anything" })).rejects.toThrow(RagEngineError);
    await expect(engine.query({ question: "anything" })).rejects.toMatchObject({ engine: "custom" });
  });

  it("returns an empty answer rather than throwing when the model emits no text block", async () => {
    mockCreate.mockResolvedValue({ content: [] });
    const engine = new CustomEngine(await seededStore(), ANTHROPIC_LLM, "voyage-key");

    await expect(engine.query({ question: "anything" })).resolves.toMatchObject({ answer: "" });
  });
});
