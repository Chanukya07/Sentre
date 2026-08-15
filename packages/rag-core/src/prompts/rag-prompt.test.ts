import { describe, expect, it } from "vitest";
import { buildRagPrompt } from "./rag-prompt";

const chunks = [
  { id: "a", text: "Velvet Dusk smells like my grandmother's house", score: 0.91, metadata: {} },
  { id: "b", text: "Rainwood is all petrichor and cedar", score: 0.72, metadata: {} },
];

describe("buildRagPrompt", () => {
  it("numbers sources from 1 so the model's [n] citations map to the sources array", () => {
    const prompt = buildRagPrompt("Which is nostalgic?", chunks);

    expect(prompt).toContain("[1]");
    expect(prompt).toContain("[2]");
    expect(prompt).not.toContain("[0]");
  });

  it("includes every chunk's text and the question", () => {
    const prompt = buildRagPrompt("Which is nostalgic?", chunks);

    for (const c of chunks) {
      expect(prompt).toContain(c.text);
    }
    expect(prompt).toContain("Which is nostalgic?");
  });

  it("instructs the model to abstain rather than answer beyond the context", () => {
    const prompt = buildRagPrompt("Which is nostalgic?", chunks);

    expect(prompt.toLowerCase()).toContain("only");
  });

  it("still produces a usable prompt when retrieval returned nothing", () => {
    const prompt = buildRagPrompt("Which is nostalgic?", []);

    expect(prompt).toContain("Which is nostalgic?");
  });
});
