"use client";

import { useState } from "react";
import { RAG_ENGINES } from "@sentre/shared";
import type { RagEngineName, RetrievedChunk } from "@sentre/shared";

interface RagResult {
  answer: string;
  sources: RetrievedChunk[];
  engine: RagEngineName;
}

export function RagPlayground() {
  const [question, setQuestion] = useState("Which fragrance feels nostalgic and earthy?");
  const [engine, setEngine] = useState<RagEngineName>("vercel-ai");
  const [result, setResult] = useState<RagResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runQuery() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await fetch("/api/rag/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, engine }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(JSON.stringify(data.error ?? "Request failed"));
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-8">
      <div className="overflow-hidden rounded-2xl border border-line bg-surface focus-within:border-accent">
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows={3}
          placeholder="Ask about the catalog…"
          className="w-full resize-none bg-transparent p-4 text-sm outline-none placeholder:text-ink-muted"
        />
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-canvas/50 px-4 py-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-ink-muted">Engine</span>
            <select
              value={engine}
              onChange={(e) => setEngine(e.target.value as RagEngineName)}
              className="rounded-full border border-line bg-canvas px-3 py-1.5 text-sm outline-none transition focus:border-accent"
            >
              {RAG_ENGINES.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={runQuery}
            disabled={loading || !question.trim()}
            className="rounded-full bg-accent px-5 py-2 text-sm font-medium text-canvas transition hover:bg-accent-strong disabled:opacity-50"
          >
            {loading ? "Retrieving…" : "Run query"}
          </button>
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-accent-strong">{error}</p>}

      {result && (
        <div className="mt-8 space-y-6">
          <div className="rounded-2xl border border-line bg-surface p-5">
            <span className="rounded-full bg-accent-soft px-2.5 py-0.5 text-xs text-accent-strong">
              {result.engine}
            </span>
            <p className="mt-3 whitespace-pre-wrap leading-relaxed">{result.answer}</p>
          </div>

          {result.sources.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-widest text-ink-muted">
                Retrieved sources
              </p>
              <ul className="mt-3 space-y-3">
                {result.sources.map((source, i) => (
                  <li key={source.id} className="rounded-xl border border-line bg-surface p-4 text-sm">
                    <div className="flex items-center justify-between text-xs text-ink-muted">
                      <span>[{i + 1}]</span>
                      <span className="font-mono">score {source.score.toFixed(3)}</span>
                    </div>
                    <p className="mt-2 leading-relaxed text-ink-muted">{source.text}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
