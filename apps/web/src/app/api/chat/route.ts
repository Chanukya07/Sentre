import { anthropic } from "@ai-sdk/anthropic";
import { streamText } from "ai";
import { NextResponse } from "next/server";
import { z } from "zod";
import { PgVectorStore, embedText } from "@sentre/rag-core";
import { ConversationService, SentimentMonitor, buildChatSystemPrompt } from "@sentre/sentimental-core";
import { getDb } from "@/db";

const RequestSchema = z.object({
  sessionId: z.string().min(8),
  message: z.string().min(1).max(2000),
});

/**
 * Streaming concierge chat. Each user turn is sentiment-classified before
 * answering; frustrated turns flip the escalated flag (surfaced to the UI
 * via the x-sentre-escalated header, persisted on the conversation row) and
 * shift the assistant's tone. Answers are grounded via the same pgvector
 * retrieval path the RAG engines use.
 */
export async function POST(request: Request) {
  const parsed = RequestSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { sessionId, message } = parsed.data;

  const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
  const voyageApiKey = process.env.VOYAGE_API_KEY;
  if (!anthropicApiKey || !voyageApiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY and VOYAGE_API_KEY must be set" },
      { status: 500 },
    );
  }

  try {
    const db = getDb();
    const conversationService = new ConversationService(db);

    const [sentiment, history, queryEmbedding] = await Promise.all([
      new SentimentMonitor(anthropicApiKey).analyze(message),
      conversationService.listBySession(sessionId),
      embedText(message, "query", voyageApiKey),
    ]);

    await conversationService.appendTurn({
      sessionId,
      role: "user",
      content: message,
      sentimentDetected: sentiment,
      escalated: sentiment.shouldEscalate,
    });

    const chunks = await new PgVectorStore(db).query(queryEmbedding, 5);

    const result = streamText({
      model: anthropic("claude-haiku-4-5-20251001"),
      system: buildChatSystemPrompt(chunks, sentiment),
      messages: [
        // Keep the last few turns so the concierge remembers the session.
        ...history.slice(-8).map((turn) => ({
          role: turn.role === "assistant" ? ("assistant" as const) : ("user" as const),
          content: turn.content,
        })),
        { role: "user" as const, content: message },
      ],
      onFinish: async ({ text }) => {
        await conversationService.appendTurn({
          sessionId,
          role: "assistant",
          content: text,
          escalated: sentiment.shouldEscalate,
        });
      },
    });

    return result.toTextStreamResponse({
      headers: {
        "x-sentre-sentiment": sentiment.sentiment,
        "x-sentre-escalated": String(sentiment.shouldEscalate),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
