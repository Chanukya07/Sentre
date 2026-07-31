#!/usr/bin/env python3
import json
import os
from pathlib import Path

from anthropic import Anthropic
from dotenv import load_dotenv

OUTPUT_DIR = Path("scripts/offline/output")
OUTPUT_FILE = OUTPUT_DIR / "synthetic_catalog.json"

CATEGORIES = [
    "fragrance",
    "toy",
    "vinyl",
    "fashion",
    "home",
]


def parse_text_response(raw_text: str) -> dict:
    start = raw_text.find("{")
    end = raw_text.rfind("}")
    if start == -1 or end == -1:
        raise ValueError("Model response did not contain JSON.")
    return json.loads(raw_text[start : end + 1])


def main() -> None:
    load_dotenv()
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise RuntimeError("ANTHROPIC_API_KEY is required.")

    client = Anthropic(api_key=api_key)

    prompt = """
Generate a synthetic retail dataset as JSON with this exact schema:
{
  "products": [{ "name": string, "category": "fragrance"|"toy"|"vinyl"|"fashion"|"home", "description": string, "era_tag": string|null, "scent_family": string|null, "price_cents": number, "image_url": string|null }],
  "reviews": [{ "product_name": string, "author_name": string, "rating": number, "review_text": string }]
}

Requirements:
- Exactly 200 products total across these categories: fragrance, toy, vinyl, fashion, home.
- 5 to 8 reviews per product.
- 30-35% of reviews should explicitly include nostalgic or memory-driven language.
- Keep product names unique.
- Return JSON only.
"""

    response = client.messages.create(
        model="claude-sonnet-5",
        max_tokens=12000,
        temperature=0.7,
        messages=[{"role": "user", "content": prompt}],
    )

    text_blocks = [block.text for block in response.content if getattr(block, "type", "") == "text"]
    payload = parse_text_response("\n".join(text_blocks))

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    OUTPUT_FILE.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    print(f"Wrote synthetic data to {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
