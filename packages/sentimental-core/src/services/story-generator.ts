import type { RagEngine } from "@sentre/rag-core";
import type { Story } from "@sentre/shared";
import { STORY_TONES } from "@sentre/shared";

export interface GenerateStoryInput {
  productId: string;
  productName: string;
  productDescription: string;
  tone?: (typeof STORY_TONES)[number];
}

/**
 * Turns a product's nostalgic reviews (retrieved via RAG over the reviews
 * marked is_nostalgic=true during ABSA) into a short emotional narrative.
 * This is the retail+sentimental+RAG integration point: retrieval grounds
 * the story in real customer memories instead of hallucinated flavor text.
 */
export class StoryGenerator {
  constructor(private readonly ragEngine: RagEngine) {}

  async generate(input: GenerateStoryInput): Promise<Omit<Story, "id" | "createdAt">> {
    const tone = input.tone ?? "nostalgic";
    const question = `Write a short, ${tone} 2-3 sentence story about "${input.productName}" (${input.productDescription}), grounded in real customer memories about it.`;

    const response = await this.ragEngine.query({
      question,
      topK: 4,
      filters: { sourceType: "review", isNostalgic: true },
    });

    return {
      productId: input.productId,
      narrative: response.answer,
      tone,
      sourceMemoryIds: response.sources.map((source) => source.id),
      generatedBy: response.engine,
    };
  }
}
