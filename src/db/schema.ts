import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  vector,
} from "drizzle-orm/pg-core";

export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  eraTag: text("era_tag"),
  scentFamily: text("scent_family"),
  priceCents: integer("price_cents").notNull(),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const reviews = pgTable("reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id").references(() => products.id),
  authorName: text("author_name").notNull(),
  rating: integer("rating").notNull(),
  reviewText: text("review_text").notNull(),
  sentiment: jsonb("sentiment"),
  emotionTags: text("emotion_tags").array(),
  isNostalgic: boolean("is_nostalgic").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const embeddings = pgTable("embeddings", {
  id: uuid("id").primaryKey().defaultRandom(),
  sourceType: text("source_type").notNull(),
  sourceId: uuid("source_id").notNull(),
  content: text("content").notNull(),
  embedding: vector("embedding", { dimensions: 1024 }),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const conversations = pgTable("conversations", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: text("session_id").notNull(),
  role: text("role").notNull(),
  content: text("content").notNull(),
  sentimentDetected: jsonb("sentiment_detected"),
  escalated: boolean("escalated").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
