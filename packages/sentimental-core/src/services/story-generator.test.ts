import { describe, expect, it, vi } from "vitest";
import type { RagEngine } from "@sentre/rag-core";
import type { RagQuery, RagResponse } from "@sentre/shared";
import { StoryGenerator } from "./story-generator";

function fakeEngine(response?: Partial<RagResponse>) {
  const query = vi.fn(
    async (_input: RagQuery): Promise<RagResponse> => ({
      answer: "She kept the bottle long after it ran dry.",
      sources: [
        { id: "rev-1", text: "smelled like my grandmother's hallway", score: 0.9, metadata: {} },
        { id: "rev-2", text: "took me straight back to 1987", score: 0.8, metadata: {} },
      ],
      engine: "vercel-ai",
      ...response,
    }),
  );
  return { engine: { name: "vercel-ai", query } as unknown as RagEngine, query };
}

const product = {
  productId: "p-1",
  productName: "Velvet Dusk",
  productDescription: "warm amber and vanilla",
};

describe("StoryGenerator", () => {
  it("retrieves only reviews flagged nostalgic, so stories are grounded in memories", async () => {
    // The whole product claim is that stories come from real nostalgic reviews;
    // dropping this filter would silently ground them in any review at all.
    const { engine, query } = fakeEngine();

    await new StoryGenerator(engine).generate(product);

    expect(query.mock.calls[0]?.[0].filters).toEqual({ sourceType: "review", isNostalgic: true });
  });

  it("defaults to a nostalgic tone and passes it to the model", async () => {
    const { engine, query } = fakeEngine();

    const story = await new StoryGenerator(engine).generate(product);

    expect(story.tone).toBe("nostalgic");
    expect(query.mock.calls[0]?.[0].question).toContain("nostalgic");
  });

  it("honours an explicit tone", async () => {
    const { engine, query } = fakeEngine();

    const story = await new StoryGenerator(engine).generate({ ...product, tone: "playful" });

    expect(story.tone).toBe("playful");
    expect(query.mock.calls[0]?.[0].question).toContain("playful");
  });

  it("records which reviews and which engine produced the story", async () => {
    const { engine } = fakeEngine();

    const story = await new StoryGenerator(engine).generate(product);

    expect(story.narrative).toBe("She kept the bottle long after it ran dry.");
    expect(story.sourceMemoryIds).toEqual(["rev-1", "rev-2"]);
    expect(story.generatedBy).toBe("vercel-ai");
    expect(story.productId).toBe("p-1");
  });

  it("reports zero sources when a product has no nostalgic reviews yet", async () => {
    const { engine } = fakeEngine({ sources: [] });

    const story = await new StoryGenerator(engine).generate(product);

    expect(story.sourceMemoryIds).toEqual([]);
  });
});
