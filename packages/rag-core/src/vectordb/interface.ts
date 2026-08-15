import type { EmbeddingVector, RetrievedChunk } from "@sentre/shared";

/**
 * Abstraction over vector store backends (Pinecone, pgvector, in-memory).
 * Engines depend on this interface, not a concrete store, so swapping
 * the backing vector DB never touches engine code.
 */
export interface VectorStore {
  upsert(vectors: EmbeddingVector[]): Promise<void>;
  query(embedding: number[], topK: number, filters?: Record<string, unknown>): Promise<RetrievedChunk[]>;
}
