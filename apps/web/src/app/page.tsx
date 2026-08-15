import Link from "next/link";
import { ProductService } from "@sentre/retail-core";
import type { ProductRecord } from "@sentre/retail-core";
import { getDb } from "@/db";

// Product catalog is read from a live database on every request — never
// baked into the static build output.
export const dynamic = "force-dynamic";

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function ProductCard({ product }: { product: ProductRecord }) {
  return (
    <Link
      href={`/products/${product.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface transition duration-200 hover:-translate-y-0.5 hover:border-accent/60 hover:shadow-[0_12px_32px_-16px_rgba(43,33,24,0.35)]"
    >
      <div className="relative flex h-40 items-end bg-gradient-to-br from-accent-soft via-surface to-accent-soft/40 p-4">
        <span className="font-display text-6xl leading-none text-accent/25 transition group-hover:text-accent/40">
          {product.name.charAt(0)}
        </span>
        {product.eraTag && (
          <span className="absolute right-3 top-3 rounded-full border border-line bg-canvas/80 px-2.5 py-0.5 text-xs text-ink-muted backdrop-blur">
            {product.eraTag}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <p className="text-xs uppercase tracking-widest text-ink-muted">{product.category}</p>
        <h2 className="font-display text-xl">{product.name}</h2>
        {product.scentFamily && (
          <span className="w-fit rounded-full bg-accent-soft px-2.5 py-0.5 text-xs text-accent-strong">
            {product.scentFamily}
          </span>
        )}
        <p className="line-clamp-2 text-sm leading-relaxed text-ink-muted">{product.description}</p>
        <div className="mt-auto flex items-center justify-between pt-3">
          <p className="font-medium">{formatPrice(product.priceCents)}</p>
          <span className="text-sm text-accent opacity-0 transition group-hover:opacity-100">
            View story →
          </span>
        </div>
      </div>
    </Link>
  );
}

export default async function Home() {
  // Degrade to the empty state when the database is unreachable or not yet
  // configured (fresh clone, missing DATABASE_URL) instead of hard-crashing
  // the storefront.
  let products: ProductRecord[] = [];
  let dbError: string | null = null;
  try {
    products = await new ProductService(getDb()).listProducts();
  } catch (error) {
    dbError = error instanceof Error ? error.message : "Database unavailable";
  }

  return (
    <main>
      <section className="relative overflow-hidden border-b border-line">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-accent-soft blur-3xl"
        />
        <div className="mx-auto w-full max-w-6xl px-6 py-20 sm:py-28">
          <p className="text-sm uppercase tracking-[0.25em] text-accent">Fragrance &amp; memory</p>
          <h1 className="mt-4 max-w-2xl font-display text-5xl leading-tight tracking-tight sm:text-6xl">
            Scents that remember.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-muted">
            Every fragrance here carries real customer memories. Our retrieval engine finds the most
            nostalgic ones and retells them as short stories — grounded, never invented.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#catalog"
              className="rounded-full bg-accent px-6 py-2.5 text-sm font-medium text-canvas transition hover:bg-accent-strong"
            >
              Browse the catalog
            </a>
            <Link
              href="/rag-playground"
              className="rounded-full border border-line bg-surface px-6 py-2.5 text-sm transition hover:border-accent hover:text-accent"
            >
              Compare four RAG engines
            </Link>
          </div>
        </div>
      </section>

      <section id="catalog" className="mx-auto w-full max-w-6xl px-6 py-14">
        <div className="mb-8 flex items-end justify-between">
          <h2 className="font-display text-3xl">The catalog</h2>
          {products.length > 0 && (
            <p className="text-sm text-ink-muted">
              {products.length} fragrance{products.length === 1 ? "" : "s"}
            </p>
          )}
        </div>

        {dbError ? (
          <div className="rounded-2xl border border-gold/40 bg-accent-soft/50 p-6 text-sm">
            <p className="font-medium">Database not configured</p>
            <p className="mt-1 text-ink-muted">
              {dbError}. Set{" "}
              <code className="rounded bg-canvas px-1.5 py-0.5">DATABASE_URL</code> in{" "}
              <code className="rounded bg-canvas px-1.5 py-0.5">.env.local</code>, then seed the
              catalog with <code className="rounded bg-canvas px-1.5 py-0.5">npm run db:seed</code>.
            </p>
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-2xl border border-line bg-surface p-6 text-sm text-ink-muted">
            The catalog is empty — seed it with{" "}
            <code className="rounded bg-canvas px-1.5 py-0.5">npm run db:seed</code> (or the full
            offline pipeline).
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <li key={product.id}>
                <ProductCard product={product} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
