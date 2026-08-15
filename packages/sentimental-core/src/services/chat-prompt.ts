import type { RetrievedChunk } from "@sentre/shared";
import type { TurnSentiment } from "./sentiment-monitor";

/**
 * System prompt for the shopping concierge: grounds answers in retrieved
 * catalog/review chunks and adapts tone to the shopper's detected state.
 * When a turn escalates, the assistant acknowledges the handoff instead of
 * pretending everything is fine.
 */
export function buildChatSystemPrompt(chunks: RetrievedChunk[], sentiment: TurnSentiment): string {
  const context = chunks
    .map((chunk, i) => `[${i + 1}] ${chunk.text}`)
    .join("\n\n");

  const toneGuidance = sentiment.shouldEscalate
    ? "The shopper is frustrated or distressed. Lead with a sincere, brief acknowledgement, tell them a human specialist has been notified and will follow up in this conversation, then still offer the most helpful answer you can."
    : sentiment.sentiment === "negative"
      ? "The shopper seems unhappy. Be warm and direct; skip upsell language."
      : "Be warm, concise, and lightly evocative — this is a nostalgia-driven fragrance shop.";

  return `You are the Sentre concierge, helping shoppers find fragrances tied to memories.

${toneGuidance}

Ground every product claim in the context below, citing sources as [n]. If the context doesn't cover the question, say so honestly rather than inventing products.

Context:
${context}`;
}
