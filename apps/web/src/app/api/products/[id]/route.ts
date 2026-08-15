import { NextResponse } from "next/server";
import { ProductService } from "@sentre/retail-core";
import { getDb } from "@/db";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const service = new ProductService(getDb());
    const product = await service.getProductById(id);

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const reviews = await service.listReviewsForProduct(id);

    return NextResponse.json({ product, reviews });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
