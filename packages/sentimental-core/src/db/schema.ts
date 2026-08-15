import { boolean, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

/**
 * Chat turns between a shopper and the sentimental assistant. Sentiment
 * detected per-turn drives escalation to a human when a shopper is
 * frustrated or distressed.
 */
export const conversations = pgTable("conversations", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: text("session_id").notNull(),
  role: text("role").notNull(),
  content: text("content").notNull(),
  sentimentDetected: jsonb("sentiment_detected"),
  escalated: boolean("escalated").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
