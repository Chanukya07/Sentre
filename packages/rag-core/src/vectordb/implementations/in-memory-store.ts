import type { EmbeddingVector, RetrievedChunk } from "@sentre/shared";
import type { VectorStore } from "../interface";

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    const ai = a[i] ?? 0;
    const bi = b[i] ?? 0;
    dot += ai * bi;
    normA += ai * ai;
    normB += bi * bi;
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Zero-dependency vector store for examples and unit tests. Not suitable
 * for production scale — see PgVectorStore for the persisted implementation.
 */
export class InMemoryVectorStore implements VectorStore {
  private vectors: EmbeddingVector[] = [];

  async upsert(vectors: EmbeddingVector[]): Promise<void> {
    for (const vector of vectors) {
      const existingIndex = this.vectors.findIndex((v) => v.id === vector.id);
      if (existingIndex >= 0) {
        this.vectors[existingIndex] = vector;
      } else {
        this.vectors.push(vector);
      }
    }
  }

  async query(embedding: number[], topK: number): Promise<RetrievedChunk[]> {
    return this.vectors
      .map((vector) => ({
        id: vector.id,
        text: String(vector.metadata.text ?? ""),
        score: cosineSimilarity(embedding, vector.values),
        metadata: vector.metadata,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }
}
