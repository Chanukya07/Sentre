import { ChatConsole } from "./chat-console";

export default function ChatPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col px-6 py-14">
      <p className="text-sm uppercase tracking-[0.25em] text-accent">Concierge</p>
      <h1 className="mt-3 font-display text-4xl tracking-tight">Ask about a memory</h1>
      <p className="mt-4 leading-relaxed text-ink-muted">
        A streaming, sentiment-aware assistant grounded in the catalog and real reviews. Every
        message is classified before answering — frustrated turns are flagged for a human specialist
        and shift the assistant&apos;s tone.
      </p>
      <ChatConsole />
    </main>
  );
}
