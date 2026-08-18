import { eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { products, reviews } from "../db/schema";
import type { ProductRecord, ReviewRecord } from "../types";

export class ProductService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- callers pass their own composed schema type; this service only uses schema-agnostic query builder methods
  constructor(private readonly db: PostgresJsDatabase<any>) {}

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
