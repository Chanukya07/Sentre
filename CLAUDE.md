# CLAUDE.md

Guidance for Claude Code sessions working in this repository.

## What this is

Sentre: a nostalgia-driven fragrance retailer with a RAG layer that turns real
customer reviews into retrieval-grounded stories, plus a streaming
sentiment-aware concierge chat. Built as an interview portfolio project —
architecture clarity matters as much as functionality. Deployed to Vercel from
`main` (auto-deploy); the app lives in `apps/web`.

## Commands

```bash
npm run dev            # start apps/web via Turbo
npm run build          # build every package + web app
npm run lint           # eslint across all workspaces
npm run type-check     # tsc across all workspaces
npm run test           # vitest (rag-core + sentimental-core)
npm run db:migrate     # drizzle migrations (needs DATABASE_URL)
npm run db:seed        # curated demo catalog (needs DATABASE_URL + VOYAGE_API_KEY)
npm run smoke          # real end-to-end check of LLM + embeddings + DB + RAG
```

Single-package runs: `npx turbo run test --filter=@sentre/rag-core` or cd into
the package and use its scripts. One test file:
`cd packages/rag-core && npx vitest run src/engine-factory.test.ts`.

## Architecture rules

- **Monorepo with schema ownership per bounded context.** `retail-core` owns
  `products`/`reviews`, `rag-core` owns `embeddings`, `sentimental-core` owns
  `conversations`. `apps/web/src/db/schema.ts` only composes them — never add
  a table there; add it to the owning package.
- **All four RAG engines share one retrieval path** (`VectorStore` in
  `rag-core/src/vectordb/interface.ts`). Never wire an engine to
  LangChain/LlamaIndex's own vector store classes — the fair-comparison
  property and the single production retrieval path both depend on this
  (rationale: docs/RAG_IMPLEMENTATION.md).
- **Adding a RAG engine**: implement `RagEngine` (one `query()` method), add
  the name to `RagEngineName` in `packages/shared/src/types/rag.ts`, add a
  case in `rag-core/src/engine-factory.ts`. Nothing else changes.
- **Generation provider is env-driven, retrieval is not.** `resolveLlmConfig()`
  (`rag-core/src/llm/config.ts`) turns `LLM_PROVIDER` into an `LlmConfig` that
  every engine and `SentimentMonitor` accepts. Adding a provider means one
  branch there plus one client branch per engine — never a new retrieval path.
- **Embeddings must stay in one vector space**: query-time embedding uses
  Voyage `voyage-4-lite` with `input_type: "query"`; indexed documents used
  `"document"`. Changing the model requires re-indexing everything.
- **Services take `NeonHttpDatabase<any>`** and use only schema-agnostic query
  builder methods — never the relational `.query` API (it pins the composed
  schema type and breaks cross-package reuse).
- **Design tokens** live in `apps/web/src/app/globals.css` as CSS variables
  (light + dark), mapped into Tailwind v4 via `@theme inline`. Use the
  semantic classes (`bg-canvas`, `text-ink`, `border-line`, `bg-accent`…);
  never hardcode hex values in components.
- **DB-dependent pages** must set `export const dynamic = "force-dynamic"` and
  degrade gracefully when `DATABASE_URL` is unset (see `app/page.tsx`).

## Conventions

- Commits are authored as the repository owner; do not add Claude
  co-author trailers or "Claude" as a commit author (owner's explicit
  preference).
- Vercel deploys from the repo root using `vercel.json`
  (`turbo run build --filter=web`, output `apps/web/.next`). Env vars used at
  build time must be declared in `turbo.json`'s `build.env` or Turbo strips
  them.
- Tests mock LLM/embedding calls (see `custom-engine.test.ts` for the
  vi.hoisted mock pattern); no test needs API keys or a database. Because of
  that, passing tests never prove the AI actually works — `npm run smoke`
  (`apps/web/scripts/smoke.ts`) is the only check that makes real calls.
- The Python `scripts/offline/` pipeline is the full-fidelity ingestion path;
  `apps/web/scripts/seed.ts` is the fast demo path. Keep both working.

## Docs

- `docs/ARCHITECTURE.md` — system design, data flow, schema ownership
- `docs/RAG_IMPLEMENTATION.md` — the four engines and the shared-retrieval decision
- `docs/INTERVIEW_GUIDE.md` — interview prep mapped to this codebase
