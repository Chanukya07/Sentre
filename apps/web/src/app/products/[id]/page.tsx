import Link from "next/link";
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
  const nostalgicCount = reviews.filter((r) => r.isNostalgic).length;

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-12">
      <Link href="/" className="text-sm text-ink-muted transition hover:text-accent">
        ← Back to catalog
      </Link>

      <div className="mt-6 grid gap-10 md:grid-cols-[1fr_1.4fr]">
        <div className="relative flex min-h-56 items-end overflow-hidden rounded-2xl border border-line bg-gradient-to-br from-accent-soft via-surface to-accent-soft/40 p-6">
          <span className="font-display text-8xl leading-none text-accent/25">
            {product.name.charAt(0)}
          </span>
          {product.eraTag && (
            <span className="absolute right-4 top-4 rounded-full border border-line bg-canvas/80 px-3 py-1 text-xs text-ink-muted backdrop-blur">
              {product.eraTag}
            </span>
          )}
        </div>

        <div>
          <p className="text-xs uppercase tracking-widest text-ink-muted">{product.category}</p>
          <h1 className="mt-2 font-display text-4xl tracking-tight">{product.name}</h1>
          <div className="mt-3 flex flex-wrap gap-2">
            {product.scentFamily && (
              <span className="rounded-full bg-accent-soft px-3 py-1 text-xs text-accent-strong">
                {product.scentFamily}
              </span>
            )}
            {nostalgicCount > 0 && (
              <span className="rounded-full border border-gold/50 px-3 py-1 text-xs text-gold">
                {nostalgicCount} nostalgic {nostalgicCount === 1 ? "memory" : "memories"}
              </span>
            )}
          </div>
          <p className="mt-4 leading-relaxed text-ink-muted">{product.description}</p>
          <p className="mt-5 font-display text-2xl">{formatPrice(product.priceCents)}</p>
        </div>
      </div>

      <StoryPanel productId={product.id} />

      <section className="mt-12">
        <h2 className="font-display text-2xl">Reviews</h2>
        {reviews.length === 0 ? (
          <p className="mt-3 text-sm text-ink-muted">No reviews yet.</p>
        ) : (
          <ul className="mt-5 space-y-4">
            {reviews.map((review) => (
              <li key={review.id} className="rounded-2xl border border-line bg-surface p-5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{review.authorName}</span>
                  <span aria-label={`${review.rating} out of 5 stars`} className="text-gold">
                    {"★".repeat(review.rating)}
                    <span className="text-line">{"★".repeat(5 - review.rating)}</span>
                  </span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">{review.reviewText}</p>
                {review.isNostalgic && (
                  <span className="mt-3 inline-block rounded-full bg-accent-soft px-2.5 py-0.5 text-xs text-accent-strong">
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
