import { NextResponse } from "next/server";
import { z } from "zod";
import { RAG_ENGINES } from "@sentre/shared";
import { buildRagEngine } from "@/lib/rag";

const RequestSchema = z.object({
  question: z.string().min(1),
  engine: z.enum(RAG_ENGINES).optional(),
  topK: z.number().int().positive().max(20).optional(),
});

/**
 * Accepts an optional `engine` field so the same endpoint can run a
 * question through langchain / llamaindex / vercel-ai / custom — useful
 * for demoing the RAG engine comparison from the UI, not just the CLI
 * example in packages/rag-core/examples.
 */
export async function POST(request: Request) {
  const body = await request.json();
  const parsed = RequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const engine = buildRagEngine(parsed.data.engine);
    const response = await engine.query({ question: parsed.data.question, topK: parsed.data.topK });
    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
