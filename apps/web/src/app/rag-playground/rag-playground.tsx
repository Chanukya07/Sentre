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
      <textarea
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        rows={3}
        className="w-full rounded border border-zinc-300 bg-transparent p-3 text-sm dark:border-zinc-700"
      />

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <select
          value={engine}
          onChange={(e) => setEngine(e.target.value as RagEngineName)}
          className="rounded border border-zinc-300 bg-transparent px-2 py-1.5 text-sm dark:border-zinc-700"
        >
          {RAG_ENGINES.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        <button
          onClick={runQuery}
          disabled={loading || !question.trim()}
          className="rounded bg-zinc-900 px-4 py-1.5 text-sm text-white disabled:opacity-50 dark:bg-white dark:text-zinc-900"
        >
          {loading ? "Running..." : "Run query"}
        </button>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {result && (
        <div className="mt-6 space-y-4">
          <div className="rounded border border-zinc-200 bg-zinc-50 p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-xs uppercase tracking-wide text-zinc-500">{result.engine}</p>
            <p className="mt-2 whitespace-pre-wrap">{result.answer}</p>
          </div>

          {result.sources.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wide text-zinc-500">Sources</p>
              <ul className="mt-2 space-y-2">
                {result.sources.map((source) => (
                  <li key={source.id} className="rounded border border-zinc-200 p-3 text-xs dark:border-zinc-800">
                    <span className="text-zinc-500">score {source.score.toFixed(3)}</span>
                    <p className="mt-1">{source.text}</p>
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
