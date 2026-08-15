"use client";

import { useState } from "react";
import { STORY_TONES } from "@sentre/shared";

interface StoryResult {
  narrative: string;
  tone: string;
  generatedBy: string;
  sourceMemoryIds: string[];
}

export function StoryPanel({ productId }: { productId: string }) {
  const [tone, setTone] = useState<(typeof STORY_TONES)[number]>("nostalgic");
  const [story, setStory] = useState<StoryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generateStory() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, tone }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Failed to generate story");
      setStory(data.story);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-10 overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="border-l-4 border-accent p-6">
        <p className="text-xs uppercase tracking-widest text-accent">Memory engine</p>
        <h2 className="mt-1 font-display text-2xl">A story from real reviews</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Retrieves this fragrance&apos;s most nostalgic customer memories and retells them — grounded
          by retrieval, never invented.
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <select
            value={tone}
            onChange={(e) => setTone(e.target.value as (typeof STORY_TONES)[number])}
            className="rounded-full border border-line bg-canvas px-4 py-2 text-sm outline-none transition focus:border-accent"
          >
            {STORY_TONES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <button
            onClick={generateStory}
            disabled={loading}
            className="rounded-full bg-accent px-5 py-2 text-sm font-medium text-canvas transition hover:bg-accent-strong disabled:opacity-50"
          >
            {loading ? "Listening to memories…" : "Generate story"}
          </button>
        </div>

        {error && <p className="mt-4 text-sm text-accent-strong">{error}</p>}

        {story && (
          <figure className="mt-5 rounded-xl bg-accent-soft/60 p-5">
            <blockquote className="font-display text-lg italic leading-relaxed">
              “{story.narrative}”
            </blockquote>
            <figcaption className="mt-3 text-xs text-ink-muted">
              {story.tone} · told by the {story.generatedBy} engine · grounded in{" "}
              {story.sourceMemoryIds.length} review{story.sourceMemoryIds.length === 1 ? "" : "s"}
            </figcaption>
          </figure>
        )}
      </div>
    </section>
  );
}
