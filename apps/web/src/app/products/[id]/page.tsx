import { notFound } from "next/navigation";
import { ProductService } from "@sentre/retail-core";
import { getDb } from "@/db";
import { StoryPanel } from "./story-panel";

export const dynamic = "force-dynamic";

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const service = new ProductService(getDb());
  const product = await service.getProductById(id);

  if (!product) {
    notFound();
  }

  const reviews = await service.listReviewsForProduct(id);

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12">
      <p className="text-xs uppercase tracking-wide text-zinc-500">{product.category}</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight">{product.name}</h1>
      <p className="mt-3 text-zinc-600 dark:text-zinc-300">{product.description}</p>
      <p className="mt-4 text-xl font-semibold">{formatPrice(product.priceCents)}</p>

      <StoryPanel productId={product.id} />

      <section className="mt-12">
        <h2 className="text-lg font-medium">Reviews</h2>
        {reviews.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500">No reviews yet.</p>
        ) : (
          <ul className="mt-4 space-y-4">
            {reviews.map((review) => (
              <li key={review.id} className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
                <div className="flex items-center justify-between text-sm text-zinc-500">
                  <span>{review.authorName}</span>
                  <span>{"★".repeat(review.rating)}</span>
                </div>
                <p className="mt-2 text-sm">{review.reviewText}</p>
                {review.isNostalgic && (
                  <span className="mt-2 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                    nostalgic
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
