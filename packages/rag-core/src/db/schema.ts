import { jsonb, pgTable, text, timestamp, uuid, vector } from "drizzle-orm/pg-core";

/**
 * Polymorphic embeddings table: one row per embedded chunk, referencing
 * its source (product description, review text, ...) by sourceType/sourceId.
 * Dimensions match Voyage AI's voyage-4-lite model used at ingestion time.
 */
export const embeddings = pgTable("embeddings", {
  id: uuid("id").primaryKey().defaultRandom(),
  sourceType: text("source_type").notNull(),
  sourceId: uuid("source_id").notNull(),
  content: text("content").notNull(),
  embedding: vector("embedding", { dimensions: 1024 }),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
