import { neon } from "@neondatabase/serverless";
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
    const sql = neon(databaseUrl);
    const result = await sql`select now() as now`;
    const now = (result as Array<{ now: string }>)[0]?.now;

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
