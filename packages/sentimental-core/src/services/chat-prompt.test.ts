import { describe, expect, it } from "vitest";
import { buildChatSystemPrompt } from "./chat-prompt";

const chunks = [
  { id: "a", text: "Velvet Dusk: warm amber and vanilla", score: 0.9, metadata: {} },
  { id: "b", text: "Rainwood: petrichor and cedar", score: 0.8, metadata: {} },
];

describe("buildChatSystemPrompt", () => {
  it("includes every retrieved chunk with 1-based citation indices", () => {
    const prompt = buildChatSystemPrompt(chunks, {
      sentiment: "neutral",
      frustrationLevel: 0,
      shouldEscalate: false,
    });

    expect(prompt).toContain("[1] Velvet Dusk");
    expect(prompt).toContain("[2] Rainwood");
  });

  it("tells the assistant a human is taking over on escalated turns", () => {
    const prompt = buildChatSystemPrompt(chunks, {
      sentiment: "negative",
      frustrationLevel: 3,
      shouldEscalate: true,
    });

    expect(prompt.toLowerCase()).toContain("human specialist");
  });

  it("keeps the standard warm tone for calm turns", () => {
    const prompt = buildChatSystemPrompt(chunks, {
      sentiment: "positive",
      frustrationLevel: 0,
      shouldEscalate: false,
    });

    expect(prompt.toLowerCase()).not.toContain("human specialist");
  });
});
