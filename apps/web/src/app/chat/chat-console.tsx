"use client";

import { useRef, useState } from "react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  sentiment?: string;
}

export function ChatConsole() {
  const [sessionId] = useState(() => crypto.randomUUID());
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [escalated, setEscalated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  async function send() {
    const message = input.trim();
    if (!message || streaming) return;

    setInput("");
    setError(null);
    setStreaming(true);
    setMessages((prev) => [...prev, { role: "user", content: message }, { role: "assistant", content: "" }]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, message }),
      });

      if (!response.ok || !response.body) {
        const data = await response.json().catch(() => null);
        throw new Error(
          typeof data?.error === "string" ? data.error : "The concierge is unavailable right now",
        );
      }

      if (response.headers.get("x-sentre-escalated") === "true") {
        setEscalated(true);
      }
      const sentiment = response.headers.get("x-sentre-sentiment") ?? undefined;
      setMessages((prev) => {
        const next = [...prev];
        const userIndex = next.length - 2;
        const user = next[userIndex];
        if (user) next[userIndex] = { ...user, sentiment };
        return next;
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        const delta = decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          if (last?.role === "assistant") {
            next[next.length - 1] = { ...last, content: last.content + delta };
          }
          return next;
        });
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      // Drop the empty assistant placeholder if nothing streamed.
      setMessages((prev) =>
        prev[prev.length - 1]?.role === "assistant" && prev[prev.length - 1]?.content === ""
          ? prev.slice(0, -1)
          : prev,
      );
    } finally {
      setStreaming(false);
    }
  }

  return (
    <div className="mt-8 flex flex-col">
      {escalated && (
        <div className="mb-4 rounded-2xl border border-gold/50 bg-accent-soft/60 px-4 py-3 text-sm">
          <span className="font-medium">A human specialist has been looped in.</span>{" "}
          <span className="text-ink-muted">
            This conversation was flagged from your messages — someone will follow up here.
          </span>
        </div>
      )}

      <div
        ref={scrollRef}
        className="flex max-h-[26rem] min-h-[16rem] flex-col gap-4 overflow-y-auto rounded-2xl border border-line bg-surface p-5"
      >
        {messages.length === 0 && (
          <p className="m-auto text-sm text-ink-muted">
            Try: “Which fragrance would remind me of childhood summers?”
          </p>
        )}
        {messages.map((message, i) => (
          <div
            key={i}
            className={message.role === "user" ? "flex justify-end" : "flex justify-start"}
          >
            <div
              className={
                message.role === "user"
                  ? "max-w-[85%] rounded-2xl rounded-br-sm bg-accent-soft px-4 py-2.5 text-sm leading-relaxed"
                  : "max-w-[85%] rounded-2xl rounded-bl-sm border border-line bg-canvas px-4 py-2.5 text-sm leading-relaxed"
              }
            >
              {message.content || (streaming && i === messages.length - 1 ? "…" : "")}
              {message.role === "user" && message.sentiment && (
                <span className="mt-1 block text-right text-[10px] uppercase tracking-wider text-ink-muted">
                  {message.sentiment}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {error && <p className="mt-3 text-sm text-accent-strong">{error}</p>}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
        className="mt-4 flex items-center gap-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask the concierge…"
          className="flex-1 rounded-full border border-line bg-surface px-5 py-2.5 text-sm outline-none transition focus:border-accent"
        />
        <button
          type="submit"
          disabled={streaming || !input.trim()}
          className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-canvas transition hover:bg-accent-strong disabled:opacity-50"
        >
          {streaming ? "…" : "Send"}
        </button>
      </form>
    </div>
  );
}
