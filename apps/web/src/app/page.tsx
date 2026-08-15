import Link from "next/link";
import { ProductService } from "@sentre/retail-core";
import { getDb } from "@/db";

// Product catalog is read from a live database on every request — never
// baked into the static build output.
export const dynamic = "force-dynamic";

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export default async function Home() {
  const products = await new ProductService(getDb()).listProducts();

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-12">
      <header className="mb-10 flex flex-col gap-2">
        <h1 className="text-4xl font-semibold tracking-tight">Sentre</h1>
        <p className="text-zinc-600 dark:text-zinc-300">
          A nostalgia-driven fragrance shop. Every product page can turn its most
          nostalgic reviews into a short story, grounded by retrieval —{" "}
          <Link href="/rag-playground" className="underline underline-offset-2">
            try the RAG playground
          </Link>{" "}
          to compare engines.
        </p>
      </header>

      {products.length === 0 ? (
        <p className="text-zinc-500">
          No products yet — run the offline pipeline (
          <code className="rounded bg-zinc-100 px-1.5 py-0.5 dark:bg-zinc-800">
            npm run offline:generate && npm run offline:absa && npm run offline:index
          </code>
          ) to seed the catalog.
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <li key={product.id}>
              <Link
                href={`/products/${product.id}`}
                className="block h-full rounded-lg border border-zinc-200 p-5 transition hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
              >
                <p className="text-xs uppercase tracking-wide text-zinc-500">{product.category}</p>
                <h2 className="mt-1 text-lg font-medium">{product.name}</h2>
                <p className="mt-2 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
                  {product.description}
                </p>
                <p className="mt-3 font-semibold">{formatPrice(product.priceCents)}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
