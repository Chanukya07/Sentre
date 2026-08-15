const VOYAGE_API_URL = "https://api.voyageai.com/v1/embeddings";
const VOYAGE_MODEL = "voyage-4-lite";

export type VoyageInputType = "document" | "query";

/**
 * Thin client for Voyage AI embeddings, matching the model used by the
 * offline ingestion pipeline (scripts/offline/index_embeddings.py) so
 * query-time embeddings live in the same vector space as indexed data.
 */
export async function embedText(text: string, inputType: VoyageInputType, apiKey: string): Promise<number[]> {
  const response = await fetch(VOYAGE_API_URL, {
    method: "POST",
    headers: {
      "X-API-Key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: VOYAGE_MODEL,
      input: [text],
      input_type: inputType,
    }),
  });

  if (!response.ok) {
    throw new Error(`Voyage embeddings request failed: ${response.status} ${await response.text()}`);
  }

  const payload = (await response.json()) as { data: Array<{ embedding: number[] }> };
  const first = payload.data[0];
  if (!first) {
    throw new Error("Voyage embeddings response contained no data");
  }
  return first.embedding;
}
