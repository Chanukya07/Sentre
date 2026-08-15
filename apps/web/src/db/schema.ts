/**
 * The web app owns no tables itself — it composes the schema owned by
 * each bounded-context package into one Drizzle client. Adding a table
 * belongs in the owning package, not here.
 */
export * from "@sentre/retail-core";
export * from "@sentre/rag-core";
export * from "@sentre/sentimental-core";
