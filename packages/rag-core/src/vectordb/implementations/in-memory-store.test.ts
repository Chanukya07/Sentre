import { describe, expect, it } from "vitest";
import { InMemoryVectorStore } from "./in-memory-store";

const EAST = [1, 0, 0];
const NORTH = [0, 1, 0];
const NORTHEAST = [1, 1, 0];

function chunk(id: string, values: number[], text = `chunk-${id}`) {
  return { id, values, metadata: { text } };
}

describe("InMemoryVectorStore", () => {
  it("ranks results by cosine similarity, nearest first", async () => {
    const store = new InMemoryVectorStore();
    await store.upsert([chunk("north", NORTH), chunk("east", EAST), chunk("northeast", NORTHEAST)]);

    const results = await store.query(EAST, 3);

    expect(results.map((r) => r.id)).toEqual(["east", "northeast", "north"]);
    expect(results[0]?.score).toBeCloseTo(1);
    expect(results[1]?.score).toBeCloseTo(Math.SQRT1_2);
    expect(results[2]?.score).toBeCloseTo(0);
  });

  it("returns at most topK results", async () => {
    const store = new InMemoryVectorStore();
    await store.upsert([chunk("a", EAST), chunk("b", NORTHEAST), chunk("c", NORTH)]);

    expect(await store.query(EAST, 2)).toHaveLength(2);
  });

  it("treats upsert as replace-by-id rather than append", async () => {
    const store = new InMemoryVectorStore();
    await store.upsert([chunk("same-id", NORTH, "original")]);
    await store.upsert([chunk("same-id", EAST, "replacement")]);

    const results = await store.query(EAST, 10);

    expect(results).toHaveLength(1);
    expect(results[0]?.text).toBe("replacement");
  });

  it("surfaces the chunk text and metadata retrieval callers depend on", async () => {
    const store = new InMemoryVectorStore();
    await store.upsert([{ id: "r1", values: EAST, metadata: { text: "smells like 1975", sourceType: "review" } }]);

    const [result] = await store.query(EAST, 1);

    expect(result?.text).toBe("smells like 1975");
    expect(result?.metadata.sourceType).toBe("review");
  });
});
