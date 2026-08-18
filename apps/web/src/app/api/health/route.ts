import postgres from "postgres";
import { NextResponse } from "next/server";

export async function GET() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    return NextResponse.json(
      { ok: false, error: "DATABASE_URL is not set" },
      { status: 500 },
    );
  }

  try {
    const sql = postgres(databaseUrl, { prepare: false });
    const result = await sql`select now() as now`;
    const now = result[0]?.now as string | undefined;
    await sql.end();

    return NextResponse.json({
      ok: true,
      database: "connected",
      timestamp: now,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        database: "disconnected",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
