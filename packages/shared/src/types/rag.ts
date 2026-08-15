export interface RetrievedChunk {
  id: string;
  text: string;
  score: number;
  metadata: Record<string, unknown>;
}

export interface RagQuery {
  question: string;
  topK?: number;
  filters?: Record<string, unknown>;
}

export interface RagResponse {
  answer: string;
  sources: RetrievedChunk[];
  engine: RagEngineName;
}

export type RagEngineName = "langchain" | "llamaindex" | "vercel-ai" | "custom";

export interface EmbeddingVector {
  id: string;
  values: number[];
  metadata: Record<string, unknown>;
}
