import Link from "next/link";
import { ProductService } from "@sentre/retail-core";
import { getDb } from "@/db";
import { CatalogGrid, type CatalogProduct } from "./catalog-grid";

// Product catalog is read from a live database on every request — never
// baked into the static build output.
export const dynamic = "force-dynamic";

const FEATURES = [
  {
    title: "Grounded, never invented",
    body: "Every story and answer cites the real reviews it was retrieved from.",
    href: "/rag-playground",
  },
  {
    title: "Four interchangeable engines",
    body: "LangChain, LlamaIndex, the Vercel AI SDK, and a hand-rolled pipeline — same retrieval, compared fairly.",
    href: "/rag-playground",
  },
  {
    title: "A concierge that listens",
    body: "Sentiment-aware streaming chat that hands frustrated shoppers to a human.",
    href: "/chat",
  },
];

export default async function Home() {
  // Degrade to the empty state when the database is unreachable or not yet
  // configured (fresh clone, missing DATABASE_URL) instead of hard-crashing
  // the storefront.
  let products: CatalogProduct[] = [];
  let dbError: string | null = null;
  try {
    const rows = await new ProductService(getDb()).listProducts();
    products = rows.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      description: p.description,
      eraTag: p.eraTag,
      scentFamily: p.scentFamily,
      priceCents: p.priceCents,
    }));
  } catch (error) {
    dbError = error instanceof Error ? error.message : "Database unavailable";
  }

  return (
    <main>
      <section className="grain relative overflow-hidden border-b border-line">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-accent-soft blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-40 -left-24 h-80 w-80 rounded-full bg-accent-soft/60 blur-3xl"
        />
        <div className="relative mx-auto w-full max-w-6xl px-6 py-20 sm:py-28">
          <p className="anim-rise text-sm uppercase tracking-[0.25em] text-accent">
            Fragrance &amp; memory
          </p>
          <h1
            className="anim-rise mt-4 max-w-2xl font-display text-5xl leading-tight tracking-tight sm:text-6xl"
            style={{ "--rise-delay": "80ms" } as React.CSSProperties}
          >
            Scents that <em className="text-accent">remember</em>.
          </h1>
          <p
            className="anim-rise mt-5 max-w-xl text-lg leading-relaxed text-ink-muted"
            style={{ "--rise-delay": "160ms" } as React.CSSProperties}
          >
            Every fragrance here carries real customer memories. Our retrieval engine finds the most
            nostalgic ones and retells them as short stories — grounded, never invented.
          </p>
          <div
            className="anim-rise mt-8 flex flex-wrap gap-3"
            style={{ "--rise-delay": "240ms" } as React.CSSProperties}
          >
            <a
              href="#catalog"
              className="rounded-full bg-accent px-6 py-2.5 text-sm font-medium text-canvas transition hover:bg-accent-strong"
            >
              Browse the catalog
            </a>
            <Link
              href="/chat"
              className="rounded-full border border-line bg-surface px-6 py-2.5 text-sm transition hover:border-accent hover:text-accent"
            >
              Ask the concierge
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 pt-12">
        <ul className="grid gap-4 sm:grid-cols-3">
          {FEATURES.map((feature, i) => (
            <li
              key={feature.title}
              className="anim-rise"
              style={{ "--rise-delay": `${300 + i * 80}ms` } as React.CSSProperties}
            >
              <Link
                href={feature.href}
                className="block h-full rounded-2xl border border-line bg-surface p-5 transition hover:border-accent/60"
              >
                <h2 className="font-display text-lg">{feature.title}</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{feature.body}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section id="catalog" className="mx-auto w-full max-w-6xl scroll-mt-20 px-6 py-14">
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
          <CatalogGrid products={products} />
        )}
      </section>
    </main>
  );
}
