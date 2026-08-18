# Sentre

A nostalgia-driven fragrance retailer with a RAG layer that turns real
customer reviews into short, retrieval-grounded stories — built as a
monorepo with four interchangeable RAG engines (LangChain, LlamaIndex, the
Vercel AI SDK, and a hand-rolled implementation) sharing one retrieval path.

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the system design and
[`docs/RAG_IMPLEMENTATION.md`](docs/RAG_IMPLEMENTATION.md) for how the RAG
engines compare.

## Structure

```
apps/web/              Next.js 15 app (App Router), deployed to Vercel
packages/shared/        Cross-cutting types and constants
packages/rag-core/       RAG engines, vector store, embeddings
packages/retail-core/    Product/review domain
packages/sentimental-core/  Conversation schema + RAG-grounded story generation
scripts/offline/        Python pipeline: synthetic data -> ABSA -> embeddings
```

## Prerequisites

- Node.js 20+
- Python 3.10+ (offline pipeline only)
- A Supabase project (use the Supavisor pooled `DATABASE_URL`, port 6543)
- `VOYAGE_API_KEY` (embeddings), plus an LLM provider key — either
  `ANTHROPIC_API_KEY` (default) or `OPENROUTER_API_KEY`

## Setup

```bash
cp .env.example .env.local
# fill in DATABASE_URL, VOYAGE_API_KEY, and your LLM provider key
npm install
```

## Local development

```bash
npm run dev          # starts apps/web via Turbo
npm run build        # builds every package + the web app
npm run type-check    # type-checks every package
npm run test         # runs unit tests (vitest) across packages
```

Health check: `curl http://localhost:3000/api/health`

## Database (Supabase + Drizzle + pgvector)

Each package owns its own tables (`retail-core`: products/reviews,
`rag-core`: embeddings, `sentimental-core`: conversations); `apps/web`
composes them into one Drizzle client.

```bash
npm run db:migrate
```

Creates `products`, `reviews`, `embeddings` (`vector(1024)` + HNSW index),
`conversations`, and the `vector`/`pgcrypto` extensions.

## Offline pipeline (not part of the deployed runtime)

```bash
python3 -m pip install -r scripts/offline/requirements.txt
npm run offline:generate   # synthetic catalog + reviews
npm run offline:absa       # Claude tool-use: sentiment, emotion tags, nostalgia flag
npm run offline:index      # Voyage AI embeddings -> Supabase (products, reviews, embeddings)
```

## Is the AI actually working?

The unit tests mock every network call, so they prove the wiring but never
touch a real model. To verify the live pipeline:

```bash
npm run smoke
```

It makes genuine calls and reports each stage independently — LLM config,
Voyage embeddings (asserting the 1024 dimensions the schema expects),
database connectivity and row counts, then one full question end to end
through retrieval and generation. A failing stage prints the exact cause
rather than hiding behind an earlier one.

## Choosing an LLM provider

Generation runs on Anthropic by default. To use any model on OpenRouter
instead, set in `.env.local` (or the Vercel project):

```bash
LLM_PROVIDER=openrouter
OPENROUTER_API_KEY=sk-or-...
LLM_MODEL=anthropic/claude-3.5-haiku   # any slug from openrouter.ai/models
```

All four RAG engines and the concierge honour this. Embeddings always come
from Voyage, so switching provider never invalidates the indexed vectors.

## RAG engine comparison

```bash
npm run example:compare-engines --workspace=@sentre/rag-core
```

Or use `/rag-playground` in the running app to compare engines against the
real catalog, and `/chat` for the streaming, sentiment-aware concierge
(frustrated messages are flagged for human escalation and persisted to the
`conversations` table).

## Deploy

Deploy `apps/web` to Vercel (set the root directory to `apps/web`, or use a
`vercel.json` at the repo root pointing there) and set the same environment
variables in the Vercel project. After deploy, verify:

- `/` loads the product catalog
- `/api/health` returns `{ "ok": true, ... }`
- `/rag-playground` returns an answer for at least one engine
