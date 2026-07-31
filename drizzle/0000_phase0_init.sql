CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  description text NOT NULL,
  era_tag text,
  scent_family text,
  price_cents integer NOT NULL,
  image_url text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id),
  author_name text NOT NULL,
  rating integer NOT NULL,
  review_text text NOT NULL,
  sentiment jsonb,
  emotion_tags text[],
  is_nostalgic boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS embeddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type text NOT NULL,
  source_id uuid NOT NULL,
  content text NOT NULL,
  embedding vector(1024),
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS embeddings_embedding_hnsw_idx
  ON embeddings USING hnsw (embedding vector_cosine_ops);

CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  role text NOT NULL,
  content text NOT NULL,
  sentiment_detected jsonb,
  escalated boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
