# Sentre

Phase 0 scaffold for Sentre: Next.js 15 + Neon Postgres + Drizzle + offline Python ingestion scripts.

## Prerequisites

- Node.js 20+
- Python 3.10+
- A Neon project (use the pooled `DATABASE_URL`)
- `ANTHROPIC_API_KEY` and `VOYAGE_API_KEY`

## Environment variables

Copy `/home/runner/work/Sentre/Sentre/.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Set:

- `DATABASE_URL` (pooled Neon connection string)
- `ANTHROPIC_API_KEY`
- `VOYAGE_API_KEY`

## Local development

```bash
npm install
npm run dev
```

Health check:

```bash
curl http://localhost:3000/api/health
```

## Database setup (Drizzle + pgvector)

Run migrations after Neon is provisioned:

```bash
npm run db:migrate
```

The migration creates:
- `products`
- `reviews`
- `embeddings` (`vector(1024)` + HNSW index)
- `conversations`
- extensions `vector`, `pgcrypto`

## Offline pipeline (not used in deployed runtime)

Install Python deps:

```bash
python3 -m pip install -r scripts/offline/requirements.txt
```

Generate synthetic catalog + reviews:

```bash
npm run offline:generate
```

Run ABSA + nostalgia tagging:

```bash
npm run offline:absa
```

Insert products/reviews and index embeddings:

```bash
npm run offline:index
```

## Deploy (Phase 0 target)

Deploy to Vercel and set the same environment variables in the Vercel project.  
After deploy, verify:

- `/` loads
- `/api/health` returns `{ "ok": true, ... }`
