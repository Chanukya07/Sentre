import type { STORY_TONES } from "../constants";

export type StoryTone = (typeof STORY_TONES)[number];

/**
 * A retrieval-grounded narrative generated from a product's nostalgic
 * reviews. `sourceMemoryIds` are the review embeddings the story was
 * grounded in, so a rendered story can always be traced back to real
 * customer text.
 */
export interface Story {
  id: string;
  productId: string;
  narrative: string;
  tone: StoryTone;
  sourceMemoryIds: string[];
  generatedBy: string;
  createdAt: Date;
}
