#!/usr/bin/env python3
import json
import os
from pathlib import Path

from anthropic import Anthropic
from dotenv import load_dotenv

INPUT_FILE = Path("scripts/offline/output/synthetic_catalog.json")
OUTPUT_FILE = Path("scripts/offline/output/synthetic_catalog_enriched.json")

TOOL_SCHEMA = {
    "name": "review_absa",
    "description": "Extract aspect sentiment and nostalgia tags from a review.",
    "input_schema": {
        "type": "object",
        "properties": {
            "sentiment": {"type": "object"},
            "emotion_tags": {"type": "array", "items": {"type": "string"}},
            "is_nostalgic": {"type": "boolean"},
        },
        "required": ["sentiment", "emotion_tags", "is_nostalgic"],
    },
}


def classify_review(client: Anthropic, review_text: str) -> dict:
    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=500,
        tools=[TOOL_SCHEMA],
        tool_choice={"type": "tool", "name": "review_absa"},
        messages=[
            {
                "role": "user",
                "content": (
                    "Analyze this retail review for aspect sentiment.\n"
                    "Aspects can include scent, packaging, durability, value, comfort, quality, fit.\n"
                    f"Review: {review_text}"
                ),
            }
        ],
    )

    for block in response.content:
        if getattr(block, "type", "") == "tool_use" and block.name == "review_absa":
            return block.input

    raise RuntimeError("No tool output returned from ABSA call.")


def main() -> None:
    load_dotenv()
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise RuntimeError("ANTHROPIC_API_KEY is required.")
    if not INPUT_FILE.exists():
        raise RuntimeError("Run synthetic generation first.")

    client = Anthropic(api_key=api_key)
    payload = json.loads(INPUT_FILE.read_text(encoding="utf-8"))

    enriched_reviews = []
    for review in payload.get("reviews", []):
        analysis = classify_review(client, review["review_text"])
        enriched_reviews.append({**review, **analysis})

    output = {"products": payload.get("products", []), "reviews": enriched_reviews}
    OUTPUT_FILE.write_text(json.dumps(output, indent=2), encoding="utf-8")
    print(f"Wrote enriched data to {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
