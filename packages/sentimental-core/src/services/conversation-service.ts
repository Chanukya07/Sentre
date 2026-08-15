import { asc, eq } from "drizzle-orm";
import type { NeonHttpDatabase } from "drizzle-orm/neon-http";
import { conversations } from "../db/schema";

export interface ConversationTurn {
  id: string;
  sessionId: string;
  role: string;
  content: string;
  sentimentDetected: unknown;
  escalated: boolean | null;
  createdAt: Date | null;
}

export interface AppendTurnInput {
  sessionId: string;
  role: "user" | "assistant";
  content: string;
  sentimentDetected?: unknown;
  escalated?: boolean;
}

export class ConversationService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- callers pass their own composed schema type; this service only uses schema-agnostic query builder methods
  constructor(private readonly db: NeonHttpDatabase<any>) {}

  async appendTurn(input: AppendTurnInput): Promise<void> {
    await this.db.insert(conversations).values({
      sessionId: input.sessionId,
      role: input.role,
      content: input.content,
      sentimentDetected: input.sentimentDetected ?? null,
      escalated: input.escalated ?? false,
    });
  }

  async listBySession(sessionId: string): Promise<ConversationTurn[]> {
    return this.db
      .select()
      .from(conversations)
      .where(eq(conversations.sessionId, sessionId))
      .orderBy(asc(conversations.createdAt));
  }
}
