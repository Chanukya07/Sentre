import Anthropic from "@anthropic-ai/sdk";
import type { LlmConfig } from "@sentre/rag-core";
import { chatCompletionTool } from "@sentre/rag-core";

export interface TurnSentiment {
  sentiment: "positive" | "negative" | "neutral" | "mixed";
  frustrationLevel: number;
  shouldEscalate: boolean;
}

interface RawSentiment {
  sentiment: TurnSentiment["sentiment"];
  frustration_level: number;
  should_escalate: boolean;
}

const TOOL_NAME = "turn_sentiment";
const TOOL_DESCRIPTION = "Classify the emotional state of a retail chat message.";

const TOOL_SCHEMA = {
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
};

function prompt(message: string): string {
  return `Classify the sentiment of this retail customer chat message:\n\n${message}`;
}

/**
 * Per-turn sentiment classifier for the chat assistant. A turn escalates
 * when the model says so OR when frustration reaches 2+ — the belt-and-
 * braces rule means an angry message can't slip through just because the
 * model under-called should_escalate.
 */
export class SentimentMonitor {
  constructor(private readonly llm: LlmConfig) {}

  private async classify(message: string): Promise<RawSentiment> {
    if (this.llm.provider === "openrouter") {
      return chatCompletionTool<RawSentiment>(this.llm, prompt(message), {
        name: TOOL_NAME,
        description: TOOL_DESCRIPTION,
        parameters: TOOL_SCHEMA,
      });
    }

    const response = await new Anthropic({ apiKey: this.llm.apiKey }).messages.create({
      model: this.llm.model,
      max_tokens: 200,
      tools: [{ name: TOOL_NAME, description: TOOL_DESCRIPTION, input_schema: TOOL_SCHEMA }],
      tool_choice: { type: "tool", name: TOOL_NAME },
      messages: [{ role: "user", content: prompt(message) }],
    });

    for (const block of response.content) {
      if (block.type === "tool_use" && block.name === TOOL_NAME) {
        return block.input as RawSentiment;
      }
    }

    throw new Error("Sentiment classification returned no tool output");
  }

  async analyze(message: string): Promise<TurnSentiment> {
    const input = await this.classify(message);
    return {
      sentiment: input.sentiment,
      frustrationLevel: input.frustration_level,
      shouldEscalate: input.should_escalate || input.frustration_level >= 2,
    };
  }
}
