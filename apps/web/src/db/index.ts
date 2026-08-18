import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

let client: ReturnType<typeof postgres> | undefined;

export function getDb() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }

  // Reuse the connection across invocations on a warm Vercel function.
  // prepare: false is required when DATABASE_URL points at Supabase's
  // Supavisor pooler in transaction mode (port 6543) — it doesn't support
  // prepared statements — and is harmless against a direct connection too.
  client ??= postgres(databaseUrl, { prepare: false });

  return drizzle({ client, schema });
}

export { schema };
