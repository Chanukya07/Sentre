import Anthropic from "@anthropic-ai/sdk";

export interface TurnSentiment {
  sentiment: "positive" | "negative" | "neutral" | "mixed";
  frustrationLevel: number;
  shouldEscalate: boolean;
}

const SENTIMENT_TOOL = {
  name: "turn_sentiment",
  description: "Classify the emotional state of a retail chat message.",
  input_schema: {
    type: "object" as const,
    properties: {
      sentiment: { type: "string", enum: ["positive", "negative", "neutral", "mixed"] },
      frustration_level: {
        type: "integer",
        minimum: 0,
        maximum: 3,
        description: "0 calm, 1 mildly annoyed, 2 frustrated, 3 angry or distressed",
      },
      should_escalate: {
        type: "boolean",
        description: "True if a human should take over (anger, distress, repeated failure, refund dispute)",
      },
    },
    required: ["sentiment", "frustration_level", "should_escalate"],
  },
};

/**
 * Per-turn sentiment classifier for the chat assistant. A turn escalates
 * when the model says so OR when frustration reaches 2+ — the belt-and-
 * braces rule means an angry message can't slip through just because the
 * model under-called should_escalate.
 */
export class SentimentMonitor {
  private readonly client: Anthropic;

  constructor(anthropicApiKey: string) {
    this.client = new Anthropic({ apiKey: anthropicApiKey });
  }

  async analyze(message: string): Promise<TurnSentiment> {
    const response = await this.client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 200,
      tools: [SENTIMENT_TOOL],
      tool_choice: { type: "tool", name: "turn_sentiment" },
      messages: [
        {
          role: "user",
          content: `Classify the sentiment of this retail customer chat message:\n\n${message}`,
        },
      ],
    });

    for (const block of response.content) {
      if (block.type === "tool_use" && block.name === "turn_sentiment") {
        const input = block.input as {
          sentiment: TurnSentiment["sentiment"];
          frustration_level: number;
          should_escalate: boolean;
        };
        return {
          sentiment: input.sentiment,
          frustrationLevel: input.frustration_level,
          shouldEscalate: input.should_escalate || input.frustration_level >= 2,
        };
      }
    }

    throw new Error("Sentiment classification returned no tool output");
  }
}
