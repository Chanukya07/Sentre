import { NextResponse } from "next/server";
import { ProductService } from "@sentre/retail-core";
import { getDb } from "@/db";

export async function GET() {
  try {
    const products = await new ProductService(getDb()).listProducts();
    return NextResponse.json({ products });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
