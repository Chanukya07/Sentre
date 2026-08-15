"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export interface CatalogProduct {
  id: string;
  name: string;
  category: string;
  description: string;
  eraTag: string | null;
  scentFamily: string | null;
  priceCents: number;
}

const FAMILY_TINTS: Record<string, string> = {
  amber: "from-tint-amber",
  woody: "from-tint-woody",
  citrus: "from-tint-citrus",
  powdery: "from-tint-powdery",
  spicy: "from-tint-spicy",
  aquatic: "from-tint-aquatic",
};

function tintClass(family: string | null): string {
  return (family && FAMILY_TINTS[family.toLowerCase()]) ?? "from-accent-soft";
}

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function CatalogGrid({ products }: { products: CatalogProduct[] }) {
  const [family, setFamily] = useState<string | null>(null);

  const families = useMemo(
    () =>
      [...new Set(products.map((p) => p.scentFamily).filter((f): f is string => Boolean(f)))].sort(),
    [products],
  );

  const visible = family ? products.filter((p) => p.scentFamily === family) : products;

  return (
    <div>
      {families.length > 1 && (
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => setFamily(null)}
            className={`rounded-full border px-3.5 py-1 text-sm transition ${
              family === null
                ? "border-accent bg-accent text-canvas"
                : "border-line bg-surface text-ink-muted hover:border-accent hover:text-accent"
            }`}
          >
            All
          </button>
          {families.map((f) => (
            <button
              key={f}
              onClick={() => setFamily(f === family ? null : f)}
              className={`rounded-full border px-3.5 py-1 text-sm transition ${
                family === f
                  ? "border-accent bg-accent text-canvas"
                  : "border-line bg-surface text-ink-muted hover:border-accent hover:text-accent"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      )}

      <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((product, i) => (
          <li key={product.id} className="anim-rise" style={{ "--rise-delay": `${i * 60}ms` } as React.CSSProperties}>
            <Link
              href={`/products/${product.id}`}
              className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface transition duration-200 hover:-translate-y-0.5 hover:border-accent/60 hover:shadow-[0_12px_32px_-16px_rgba(43,33,24,0.35)]"
            >
              <div
                className={`relative flex h-40 items-end bg-gradient-to-br via-surface to-accent-soft/40 p-4 ${tintClass(product.scentFamily)}`}
              >
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
                <h3 className="font-display text-xl">{product.name}</h3>
                {product.scentFamily && (
                  <span className="w-fit rounded-full bg-accent-soft px-2.5 py-0.5 text-xs text-accent-strong">
                    {product.scentFamily}
                  </span>
                )}
                <p className="line-clamp-2 text-sm leading-relaxed text-ink-muted">
                  {product.description}
                </p>
                <div className="mt-auto flex items-center justify-between pt-3">
                  <p className="font-medium">{formatPrice(product.priceCents)}</p>
                  <span className="text-sm text-accent opacity-0 transition group-hover:opacity-100">
                    View story →
                  </span>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
