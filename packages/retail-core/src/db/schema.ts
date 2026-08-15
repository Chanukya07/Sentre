import { boolean, integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

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

/**
 * retail-core owns the review record itself; the sentiment/emotion_tags/
 * is_nostalgic columns are enriched by sentimental-core's ABSA pipeline
 * writing back onto this same row rather than a separate joined table.
 */
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
