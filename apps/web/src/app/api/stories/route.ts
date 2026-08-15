import { NextResponse } from "next/server";
import { z } from "zod";
import { ProductService } from "@sentre/retail-core";
import { StoryGenerator } from "@sentre/sentimental-core";
import { STORY_TONES } from "@sentre/shared";
import { getDb } from "@/db";
import { buildRagEngine } from "@/lib/rag";

const RequestSchema = z.object({
  productId: z.string().uuid(),
  tone: z.enum(STORY_TONES).optional(),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = RequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const db = getDb();
    const product = await new ProductService(db).getProductById(parsed.data.productId);

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const story = await new StoryGenerator(buildRagEngine()).generate({
      productId: product.id,
      productName: product.name,
      productDescription: product.description,
      tone: parsed.data.tone,
    });

    return NextResponse.json({ story });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
