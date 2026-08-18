import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockCreate } = vi.hoisted(() => ({ mockCreate: vi.fn() }));

vi.mock("@anthropic-ai/sdk", () => ({
  default: vi.fn(() => ({ messages: { create: mockCreate } })),
}));

import { SentimentMonitor } from "./sentiment-monitor";

const ANTHROPIC_LLM = {
  provider: "anthropic" as const,
  apiKey: "key",
  model: "claude-haiku-4-5-20251001",
};

function toolResponse(input: Record<string, unknown>) {
  return { content: [{ type: "tool_use", name: "turn_sentiment", input }] };
}

describe("SentimentMonitor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("parses the tool output into a TurnSentiment", async () => {
    mockCreate.mockResolvedValue(
      toolResponse({ sentiment: "positive", frustration_level: 0, should_escalate: false }),
    );

    const result = await new SentimentMonitor(ANTHROPIC_LLM).analyze("I love this shop!");

    expect(result).toEqual({ sentiment: "positive", frustrationLevel: 0, shouldEscalate: false });
  });

  it("escalates when the model says so", async () => {
    mockCreate.mockResolvedValue(
      toolResponse({ sentiment: "negative", frustration_level: 1, should_escalate: true }),
    );

    const result = await new SentimentMonitor(ANTHROPIC_LLM).analyze("This is my third refund request.");

    expect(result.shouldEscalate).toBe(true);
  });

  it("escalates on high frustration even when the model under-calls should_escalate", async () => {
    // The belt-and-braces rule: frustration_level >= 2 escalates regardless,
    // so an angry message can't slip through on a single under-called flag.
    mockCreate.mockResolvedValue(
      toolResponse({ sentiment: "negative", frustration_level: 3, should_escalate: false }),
    );

    const result = await new SentimentMonitor(ANTHROPIC_LLM).analyze("ABSOLUTELY USELESS. NOTHING WORKS.");

    expect(result.shouldEscalate).toBe(true);
  });

  it("does not escalate calm turns", async () => {
    mockCreate.mockResolvedValue(
      toolResponse({ sentiment: "neutral", frustration_level: 1, should_escalate: false }),
    );

    const result = await new SentimentMonitor(ANTHROPIC_LLM).analyze("What's your lightest citrus scent?");

    expect(result.shouldEscalate).toBe(false);
  });

  it("throws when the model returns no tool output", async () => {
    mockCreate.mockResolvedValue({ content: [{ type: "text", text: "hello" }] });

    await expect(new SentimentMonitor(ANTHROPIC_LLM).analyze("anything")).rejects.toThrow(/no tool output/i);
  });
});
