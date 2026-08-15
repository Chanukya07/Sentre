import { eq } from "drizzle-orm";
import type { NeonHttpDatabase } from "drizzle-orm/neon-http";
import { products, reviews } from "../db/schema";
import type { ProductRecord, ReviewRecord } from "../types";

export class ProductService {
  constructor(private readonly db: NeonHttpDatabase) {}

  async listProducts(): Promise<ProductRecord[]> {
    return this.db.select().from(products);
  }

  async getProductById(id: string): Promise<ProductRecord | null> {
    const rows = await this.db.select().from(products).where(eq(products.id, id)).limit(1);
    return rows[0] ?? null;
  }

  async listReviewsForProduct(productId: string): Promise<ReviewRecord[]> {
    return this.db.select().from(reviews).where(eq(reviews.productId, productId));
  }
}
