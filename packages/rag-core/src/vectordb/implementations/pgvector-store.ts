import { sql } from "drizzle-orm";
import type { NeonHttpDatabase } from "drizzle-orm/neon-http";
import type { EmbeddingVector, RetrievedChunk } from "@sentre/shared";
import type { VectorStore } from "../interface";
import { embeddings } from "../../db/schema";

function toVectorLiteral(values: number[]): string {
  return `[${values.join(",")}]`;
}

/**
 * Production vector store backed by Neon Postgres + pgvector, matching the
 * `embeddings` table populated by the offline ingestion pipeline
 * (scripts/offline/index_embeddings.py). Uses cosine distance (`<=>`) with
 * the HNSW index created in the Drizzle migration.
 */
export class PgVectorStore implements VectorStore {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- callers pass their own composed schema type; this store only uses schema-agnostic query builder methods
  constructor(private readonly db: NeonHttpDatabase<any>) {}

  async upsert(vectors: EmbeddingVector[]): Promise<void> {
    for (const vector of vectors) {
      await this.db.insert(embeddings).values({
        sourceType: String(vector.metadata.sourceType ?? "unknown"),
        sourceId: vector.id,
        content: String(vector.metadata.text ?? ""),
        embedding: vector.values,
        metadata: vector.metadata,
      });
    }
  }

  async query(embedding: number[], topK: number, filters?: Record<string, unknown>): Promise<RetrievedChunk[]> {
    const vectorLiteral = toVectorLiteral(embedding);
    const sourceTypeFilter = filters?.sourceType
      ? sql`AND source_type = ${filters.sourceType}`
      : sql``;
    // metadata.is_nostalgic is set by the offline ABSA pipeline for review embeddings.
    const nostalgicFilter = filters?.isNostalgic
      ? sql`AND metadata->>'is_nostalgic' = 'true'`
      : sql``;

    const rows = await this.db.execute<{
      id: string;
      content: string;
      metadata: Record<string, unknown> | null;
      distance: number;
    }>(sql`
      SELECT id, content, metadata, embedding <=> ${vectorLiteral}::vector AS distance
      FROM embeddings
      WHERE embedding IS NOT NULL ${sourceTypeFilter} ${nostalgicFilter}
      ORDER BY distance ASC
      LIMIT ${topK}
    `);

    return rows.rows.map((row) => ({
      id: row.id,
      text: row.content,
      score: 1 - row.distance,
      metadata: row.metadata ?? {},
    }));
  }
}
