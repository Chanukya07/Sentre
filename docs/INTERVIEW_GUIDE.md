# Interview guide

How to present Sentre in interviews, and the questions each part of the
codebase is likely to provoke — with answers grounded in decisions actually
made here. Written for AI/LLM-company interviews at entry level.

## The 60-second pitch

> "Sentre is a fragrance shop where every product's story is generated from
> its real customer reviews — retrieved, not invented. I built it as an npm
> monorepo: a Next.js storefront on Vercel, and a `rag-core` package with
> four interchangeable RAG engines — LangChain, LlamaIndex, the Vercel AI
> SDK, and one I wrote by hand — all sharing a single pgvector retrieval
> path so the frameworks can be compared fairly. There's also a streaming
> concierge chat that classifies the sentiment of every message and
> escalates frustrated shoppers to a human. Postgres is on Supabase with
> pgvector; embeddings are Voyage AI; generation is Claude."

## The demo script (5 minutes)

1. **Home page** — point out the catalog is server-rendered from Postgres;
   mention graceful degradation when the DB is unreachable.
2. **A product page** — generate a story; point at the "grounded in N
   reviews" caption: the story's sources are the nostalgic reviews the ABSA
   pass flagged, retrieved by vector similarity.
3. **RAG playground** — run one question through two different engines;
   show identical sources but different generation. Say why: shared
   retrieval isolates the framework comparison to the generation layer.
4. **Concierge** — send a calm message, then an angry one ("this is my
   third refund request and nobody answers") and show the escalation
   banner + tone shift.
5. **The code** — open `packages/rag-core/src/engines/` and show the four
   engines implementing one abstract class; open `engine-factory.ts`.

## Questions you should expect — and strong answers

### "Walk me through what happens when a user asks the chat a question."

The route classifies the message's sentiment first (a small Claude tool-use
call returning sentiment, frustration 0–3, and an escalation flag — with a
hard rule that frustration ≥ 2 escalates even if the model under-calls the
flag). In parallel it embeds the question with Voyage and loads the session
history. The turn is persisted with its sentiment JSON. Then pgvector
retrieves the top-5 chunks by cosine distance, the system prompt is built
from those chunks plus tone guidance, and the answer streams back via the
Vercel AI SDK, with the assistant turn persisted on finish. Escalation and
sentiment travel to the UI as response headers so the client can show the
banner before the stream finishes.

### "Why four RAG engines? Isn't that overengineering?"

The point is the comparison, not the redundancy. Each engine is ~50 lines
because retrieval, prompt-building, and the vector store are shared — the
only variable is the orchestration/generation framework. That's what makes
the comparison meaningful: same question, same retrieved chunks, different
framework ergonomics. The hand-rolled engine is the baseline that shows
what the frameworks actually abstract.

### "Why didn't you use LangChain's / LlamaIndex's own vector stores?"

Two reasons. Fairness: if each framework used its own retrieval, a quality
difference could come from either layer and you couldn't isolate which.
Operations: one `PgVectorStore` is the only code that talks to Postgres, so
it's exercised by every engine — there's no second, less-tested retrieval
path. The trade-off I accepted: I don't showcase their loaders/splitters/
retriever chains. I'd reach for those in a project where ingestion
complexity is the problem being solved.

### "Why pgvector instead of Pinecone/Weaviate/a vector DB?"

The data is relational (products → reviews → embeddings with foreign keys),
and volumes are small. One database means one thing to operate, transactional
writes across tables, and SQL filters (`source_type`, `is_nostalgic` in
metadata) in the same query as the ANN search — with an HNSW index for
speed. If I outgrew it (tens of millions of vectors, heavy QPS), the
`VectorStore` interface means adding a Pinecone implementation is one new
class, no engine changes.

### "Postgres from a serverless function — doesn't that exhaust connections?"

Yes, if you connect directly. Vercel functions scale out per request, and a
raw TCP connection per invocation would blow through Postgres's connection
limit under real concurrency. That's why `DATABASE_URL` points at Supabase's
Supavisor pooler in *transaction* mode (port 6543) rather than a direct
connection, and the driver sets `prepare: false` — transaction-mode pooling
doesn't support server-side prepared statements, since a pooled connection
can be handed to a different client between statements. Getting this wrong
is a real, common failure mode with Postgres-on-serverless, and it's worth
naming that trade-off explicitly rather than pretending connection pooling
is free.

### "How do you keep embeddings consistent?"

Query-time and index-time embeddings must live in the same vector space:
both use Voyage `voyage-4-lite`, and Voyage distinguishes `input_type:
"document"` (indexing) from `"query"` (search). I have a unit test that
fails if a question is ever embedded as `"document"` — that bug degrades
retrieval silently instead of erroring, which is why it's tested.

### "How would you evaluate this RAG system?"

Three layers. Retrieval: a labeled set of question → relevant-review pairs,
measure recall@k / MRR. Generation: LLM-as-judge scoring for groundedness
(does every claim trace to a cited chunk?) with spot-check human review.
End-to-end: goldens for the playground comparing engines on the same
questions. I'd wire that as a CI job with a small fixed dataset so
regressions in prompts or retrieval parameters get caught. (Honest gap:
this repo doesn't ship evals yet — say so if asked, then describe the plan.)

### "What breaks at scale, and what would you change?"

The sentiment call adds a serial LLM round-trip before every answer —
at scale I'd run it async and let escalation land mid-stream, or batch it.
`listProducts` has no pagination. Chat history replays the last 8 turns
verbatim — long sessions need summarization. The seed path embeds
serially. And I'd add rate limiting and per-session auth before real
users touch it.

### "Why a monorepo? Why not one Next.js app?"

Schema ownership. Each domain package owns its own tables and services
(`retail-core`: products/reviews; `rag-core`: embeddings;
`sentimental-core`: conversations), and the web app only composes them.
That's how team boundaries work on real codebases — a reviewer can see the
whole retail surface in one package. It also keeps `rag-core` deployable
apart from the storefront — it has no Next.js imports at all.

### "What was the hardest bug?"

Two good stories: (1) Vercel's monorepo deploy — the build succeeded but
deploy failed on a missing `routes-manifest.json` because output moved to
`apps/web/.next`; fixed with `vercel.json` + learning that Turbo strips
env vars not declared in `turbo.json`. (2) The `@ai-sdk/anthropic` v1 →
zod v3 peer conflict against our zod v4, solved by upgrading to AI SDK v5
— a real dependency-archaeology exercise.

## Things NOT to claim

- Don't claim production-grade auth, rate limiting, or evals — they're not
  built. Framing: "next on the roadmap, here's how I'd do it."
- Don't call the synthetic reviews real data. The pipeline is real; the
  reviews are generated/curated.
- Don't overstate the ABSA pass — it's a Claude tool-use classification,
  not a trained model. That's a strength (pragmatic), presented honestly.
