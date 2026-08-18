# RAG implementation

`packages/rag-core` implements the same retrieve-then-generate pipeline four
ways, so the framework choice is isolated to the generation/orchestration
layer and can be compared fairly. All four:

1. Embed the question with Voyage AI (`voyage-4-lite`, matching the offline
   indexing pipeline).
2. Retrieve the top-K nearest chunks from `VectorStore` (pgvector cosine
   distance in production).
3. Build the same prompt (`prompts/rag-prompt.ts`) from those chunks.
4. Call an LLM and return `{ answer, sources, engine }`.

Only step 4 (and, for the framework engines, how the call is made) differs.

## The four engines

| Engine | File | What it demonstrates |
|---|---|---|
| `custom` | `engines/custom-engine.ts` | The mechanics with no framework: raw `@anthropic-ai/sdk` call. Useful baseline for judging what LangChain/LlamaIndex actually add. |
| `vercel-ai` | `engines/vercel-ai-engine.ts` | Vercel AI SDK's `generateText`. Chosen as the **default** for the deployed app — it integrates with Next.js Route Handlers with the least glue code and supports streaming if the UI needs it later. |
| `langchain` | `engines/langchain-engine.ts` | `ChatAnthropic` from `@langchain/anthropic`. Shows familiarity with the most widely-adopted orchestration framework. |
| `llamaindex` | `engines/llamaindex-engine.ts` | `@llamaindex/anthropic`'s LLM wrapper. LlamaIndex is usually chosen for its own indexing/retrieval primitives; here it's deliberately used only for generation so the comparison against the other three is apples-to-apples (see below). |

Selectable via the `RagEngineName` type (`"custom" | "vercel-ai" | "langchain"
| "llamaindex"`), `packages/rag-core/src/engine-factory.ts`'s `createRagEngine()`
factory, and, in the app, either the `DEFAULT_RAG_ENGINE` env var or the
`engine` field on `POST /api/rag/query`.

## Two independent axes: engine and provider

Which *framework* orchestrates generation (the four engines above) is
separate from which *model* generates. `LLM_PROVIDER` picks the latter:

| Provider | Credentials | Model |
|---|---|---|
| `anthropic` (default) | `ANTHROPIC_API_KEY` | `LLM_MODEL`, defaulting to `claude-haiku-4-5-20251001` |
| `openrouter` | `OPENROUTER_API_KEY` | `LLM_MODEL` — **required**, a `vendor/model` slug from [openrouter.ai/models](https://openrouter.ai/models) |

`resolveLlmConfig()` (`src/llm/config.ts`) reads the environment once and
returns an `LlmConfig` that every engine takes. OpenRouter is OpenAI
wire-compatible, so each framework needs only its OpenAI client pointed at
`https://openrouter.ai/api/v1`:

- **vercel-ai** — `createOpenAI({ baseURL })` instead of `createAnthropic()`
- **langchain** — `ChatOpenAI({ configuration: { baseURL } })` instead of `ChatAnthropic`
- **llamaindex** — `@llamaindex/openai` with `additionalSessionOptions.baseURL`
- **custom** — a direct `POST /chat/completions` (no SDK), mirroring how it
  calls Anthropic's REST API directly

The model is *required* rather than defaulted for OpenRouter deliberately: it
hosts thousands of slugs and no default is meaningful, so a guessed one would
surface as a confusing upstream 404 instead of a clear setup error.

**Retrieval is unaffected by this switch.** Embeddings always come from Voyage,
so the vector space is identical no matter which model generates — the same
property that makes the four-engine comparison fair also makes the provider
swap safe. `VOYAGE_API_KEY` is required either way.

## Why retrieval is NOT delegated to LangChain/LlamaIndex's own vector store classes

LangChain and LlamaIndex both ship their own `VectorStore` abstractions. This
project intentionally does not use them. All four engines retrieve through
the same `VectorStore` interface in `vectordb/interface.ts` instead, for two
reasons:

- **Fair comparison.** If `langchain`'s engine used LangChain's Postgres
  vector store while `custom` used a hand-rolled query, a difference in
  answer quality or latency could come from either the retrieval layer or
  the generation layer — you couldn't isolate which. Sharing one retrieval
  path means the only variable across engines is generation/orchestration.
- **One production vector store to operate.** `PgVectorStore` is the only
  code path that talks to Postgres. It's exercised by every engine, so bugs
  in it surface regardless of which engine a caller picks — there's no
  second, less-tested retrieval path for one specific framework.

The trade-off: this project doesn't showcase LangChain's or LlamaIndex's own
retrieval primitives (their document loaders, text splitters, retriever
chains). That's a deliberate scope cut — the vector store abstraction is
this project's, the generation layer is the frameworks'.

## Extending

Adding a fifth engine (e.g. a local model via Ollama) means:

1. Implement `RagEngine` (`engines/base-engine.ts`) — one `query()` method.
2. Add its name to `RagEngineName` in `packages/shared/src/types/rag.ts`.
3. Add a case to `createRagEngine()`.

No existing engine, route, or UI code changes.

## Running the comparison

```bash
npm run example:compare-engines --workspace=@sentre/rag-core
```

Runs one question through all four engines against an in-memory store (see
`packages/rag-core/examples/compare-engines.ts`). Requires
`ANTHROPIC_API_KEY` and `VOYAGE_API_KEY`.

The same comparison is available with the real pgvector-backed catalog at
`/rag-playground` in the running app.
