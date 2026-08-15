# Architecture

Sentre is a nostalgia-driven fragrance retailer: a product catalog, real customer
reviews with sentiment/nostalgia tagging, and a RAG layer that turns those
reviews into short, retrieval-grounded stories.

## Monorepo layout

```
apps/
  web/                 Next.js 15 app (App Router), deployed to Vercel
packages/
  shared/              Cross-cutting types (Product, Story, RagQuery, ...) and constants
  rag-core/            RAG engines, vector store, embeddings, RAG-related DB schema
  retail-core/         Product/review domain: DB schema + ProductService
  sentimental-core/    Conversation schema + StoryGenerator
scripts/offline/       Python pipeline: synthetic data -> ABSA -> embeddings (not part of the runtime)
```

Each package owns the database tables for its own bounded context and exports
them from a `db/schema.ts`. `apps/web/src/db/schema.ts` composes all three into
one Drizzle client — the web app owns no tables of its own:

```
retail-core   -> products, reviews
rag-core      -> embeddings
sentimental-core -> conversations
```

This mirrors how a larger team would split ownership: whoever changes the
review schema works in `retail-core`, whoever changes the RAG engines works in
`rag-core`, and the composition point in `apps/web` never needs to change
for either.

## Data flow

```
Offline (scripts/offline/, Python, run manually — not part of the deployed app)
  generate_synthetic_data.py  -> synthetic_catalog.json
  run_absa.py                 -> Claude tool-use extracts sentiment/emotion_tags/is_nostalgic
  index_embeddings.py         -> Voyage AI embeddings -> Neon Postgres (products, reviews, embeddings)

Runtime (apps/web, Next.js Route Handlers)
  GET  /api/products           -> retail-core ProductService -> products table
  GET  /api/products/[id]      -> retail-core ProductService -> product + reviews
  POST /api/rag/query          -> rag-core: embed question (Voyage) -> PgVectorStore -> chosen engine -> LLM
  POST /api/stories            -> sentimental-core StoryGenerator -> rag-core engine
                                   (retrieval filtered to is_nostalgic=true reviews) -> narrative
```

Query-time embeddings use the same Voyage model (`voyage-4-lite`) as the
offline indexing step, so retrieval happens in the same vector space as the
indexed data — a query embedded with a different model would silently return
nonsense nearest-neighbors.

## Why a vector store abstraction

`packages/rag-core/src/vectordb/interface.ts` defines `VectorStore` with two
implementations:

- `PgVectorStore` — the real backend, querying the `embeddings` table via
  pgvector cosine distance (`<=>`) with the HNSW index from the Drizzle
  migration.
- `InMemoryVectorStore` — zero-dependency, used by
  `packages/rag-core/examples/compare-engines.ts` so the engine comparison
  runs without a database.

All four RAG engines depend on `VectorStore`, not on Postgres or pgvector
directly. Swapping to Pinecone or Weaviate later means adding one class, not
touching engine code — see `RAG_IMPLEMENTATION.md` for why the engines
themselves are also swappable.

## Deployment

- **apps/web** deploys to Vercel as a standard Next.js app. Route Handlers
  under `src/app/api/**` run as serverless functions.
- **Database**: Neon Postgres (serverless driver, HTTP-based — no connection
  pooling required from a serverless function).
- **Offline pipeline**: run manually/locally or in CI before deploy; it is
  not invoked at runtime. See the root `README.md` for the exact commands.

## Verification

- `npm run build` (root, via Turbo) builds every package and the web app.
- `npm run type-check` (root) type-checks every package.
- `npm run test` (root) runs the vitest suites. They cover the logic that
  fails *silently* rather than loudly: cosine ranking order, prompt source
  numbering, engine-factory coverage of every `RagEngineName`, that questions
  are embedded with `input_type: "query"` (embedding them as `"document"`
  degrades retrieval without erroring), and that `StoryGenerator` filters
  retrieval to `is_nostalgic` reviews. Network and LLM calls are mocked, so
  the suite needs no API keys and no database.
- `packages/rag-core/examples/compare-engines.ts` exercises all four engines
  end-to-end against an in-memory store (needs `ANTHROPIC_API_KEY` and
  `VOYAGE_API_KEY`).
- `/api/health` verifies the deployed app can reach Neon.
