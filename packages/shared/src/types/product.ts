import { z } from "zod";

export const ProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  price: z.number().positive(),
  currency: z.string().default("USD"),
  category: z.string(),
  imageUrl: z.string().url().optional(),
  attributes: z.record(z.string(), z.string()).default({}),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Product = z.infer<typeof ProductSchema>;

export const MemorySchema = z.object({
  id: z.string(),
  userId: z.string(),
  productId: z.string().optional(),
  text: z.string(),
  sentiment: z.enum(["positive", "negative", "neutral", "mixed"]).optional(),
  createdAt: z.date(),
});

export type Memory = z.infer<typeof MemorySchema>;

export const StorySchema = z.object({
  id: z.string(),
  productId: z.string(),
  narrative: z.string(),
  tone: z.enum(["nostalgic", "aspirational", "warm", "playful", "reflective"]),
  sourceMemoryIds: z.array(z.string()).default([]),
  generatedBy: z.string(),
  createdAt: z.date(),
});

export type Story = z.infer<typeof StorySchema>;
