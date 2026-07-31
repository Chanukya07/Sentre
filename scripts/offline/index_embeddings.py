#!/usr/bin/env python3
import json
import os
from pathlib import Path

import psycopg
import requests
from dotenv import load_dotenv

INPUT_FILE = Path("scripts/offline/output/synthetic_catalog_enriched.json")
VOYAGE_API_URL = "https://api.voyageai.com/v1/embeddings"


def embed_text(text: str, input_type: str, api_key: str) -> list[float]:
    response = requests.post(
        VOYAGE_API_URL,
        headers={"X-API-Key": api_key, "Content-Type": "application/json"},
        json={
            "model": "voyage-4-lite",
            "input": [text],
            "input_type": input_type,
        },
        timeout=60,
    )
    response.raise_for_status()
    payload = response.json()
    return payload["data"][0]["embedding"]


def to_vector_literal(values: list[float]) -> str:
    return "[" + ",".join(f"{value:.8f}" for value in values) + "]"


def main() -> None:
    load_dotenv()
    database_url = os.environ.get("DATABASE_URL")
    voyage_api_key = os.environ.get("VOYAGE_API_KEY")
    if not database_url:
        raise RuntimeError("DATABASE_URL is required.")
    if not voyage_api_key:
        raise RuntimeError("VOYAGE_API_KEY is required.")
    if not INPUT_FILE.exists():
        raise RuntimeError("Run synthetic generation and ABSA first.")

    payload = json.loads(INPUT_FILE.read_text(encoding="utf-8"))

    with psycopg.connect(database_url) as conn:
        with conn.cursor() as cur:
            product_ids: dict[str, str] = {}

            for product in payload.get("products", []):
                cur.execute(
                    """
                    INSERT INTO products (name, category, description, era_tag, scent_family, price_cents, image_url)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                    RETURNING id
                    """,
                    (
                        product["name"],
                        product["category"],
                        product["description"],
                        product.get("era_tag"),
                        product.get("scent_family"),
                        int(product["price_cents"]),
                        product.get("image_url"),
                    ),
                )
                product_id = cur.fetchone()[0]
                product_ids[product["name"]] = str(product_id)

                product_embedding = embed_text(product["description"], "document", voyage_api_key)
                cur.execute(
                    """
                    INSERT INTO embeddings (source_type, source_id, content, embedding, metadata)
                    VALUES (%s, %s::uuid, %s, %s::vector, %s::jsonb)
                    """,
                    (
                        "product",
                        product_id,
                        product["description"],
                        to_vector_literal(product_embedding),
                        json.dumps({"category": product["category"]}),
                    ),
                )

            for review in payload.get("reviews", []):
                product_id = product_ids[review["product_name"]]
                cur.execute(
                    """
                    INSERT INTO reviews (product_id, author_name, rating, review_text, sentiment, emotion_tags, is_nostalgic)
                    VALUES (%s::uuid, %s, %s, %s, %s::jsonb, %s::text[], %s)
                    RETURNING id
                    """,
                    (
                        product_id,
                        review["author_name"],
                        int(review["rating"]),
                        review["review_text"],
                        json.dumps(review.get("sentiment", {})),
                        review.get("emotion_tags", []),
                        bool(review.get("is_nostalgic", False)),
                    ),
                )
                review_id = cur.fetchone()[0]
                review_embedding = embed_text(review["review_text"], "document", voyage_api_key)
                cur.execute(
                    """
                    INSERT INTO embeddings (source_type, source_id, content, embedding, metadata)
                    VALUES (%s, %s::uuid, %s, %s::vector, %s::jsonb)
                    """,
                    (
                        "review",
                        review_id,
                        review["review_text"],
                        to_vector_literal(review_embedding),
                        json.dumps(
                            {
                                "rating": review["rating"],
                                "is_nostalgic": bool(review.get("is_nostalgic", False)),
                            }
                        ),
                    ),
                )

        conn.commit()

    print("Inserted products, reviews, and embeddings.")


if __name__ == "__main__":
    main()
