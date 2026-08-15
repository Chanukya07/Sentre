/**
 * Seeds the database with a curated demo catalog: 6 fragrances, hand-written
 * reviews pre-tagged with sentiment/nostalgia (no ABSA call needed), and
 * Voyage embeddings for both products and reviews.
 *
 * Run from apps/web:  npm run db:seed
 * Requires: DATABASE_URL, VOYAGE_API_KEY. Idempotent-ish: skips seeding if
 * any products already exist, so it never duplicates a live catalog.
 *
 * The Python pipeline in scripts/offline/ remains the "full" path (synthetic
 * generation + Claude ABSA); this script is the fast path to a working demo.
 */
import { embedText } from "@sentre/rag-core";
import { getDb, schema } from "../src/db";

interface SeedReview {
  authorName: string;
  rating: number;
  reviewText: string;
  emotionTags: string[];
  isNostalgic: boolean;
}

interface SeedProduct {
  name: string;
  category: string;
  description: string;
  eraTag: string | null;
  scentFamily: string | null;
  priceCents: number;
  reviews: SeedReview[];
}

const CATALOG: SeedProduct[] = [
  {
    name: "Velvet Dusk",
    category: "Eau de parfum",
    description:
      "Warm amber and vanilla over sandalwood and a whisper of smoked oud — the scent of long 1970s evenings when nobody was in a hurry.",
    eraTag: "1970s",
    scentFamily: "amber",
    priceCents: 8900,
    reviews: [
      {
        authorName: "Meera K.",
        rating: 5,
        reviewText:
          "My grandmother kept a bottle like this on her dresser. One spray and I'm eight years old again, watching her get ready for evening walks.",
        emotionTags: ["nostalgia", "warmth", "family"],
        isNostalgic: true,
      },
      {
        authorName: "Daniel R.",
        rating: 4,
        reviewText: "Rich and warm without being heavy. The oud is subtle — more memory than smoke.",
        emotionTags: ["comfort"],
        isNostalgic: false,
      },
      {
        authorName: "Sofia L.",
        rating: 5,
        reviewText:
          "Smells exactly like my parents' record evenings — vinyl sleeves, vanilla candles, and my mother's shawl. I didn't expect a perfume to undo forty years.",
        emotionTags: ["nostalgia", "family", "music"],
        isNostalgic: true,
      },
    ],
  },
  {
    name: "Rainwood",
    category: "Eau de toilette",
    description:
      "Petrichor, cedar, and wet moss — a forest walk after summer rain, bottled before the sun comes back out.",
    eraTag: "childhood summers",
    scentFamily: "woody",
    priceCents: 7400,
    reviews: [
      {
        authorName: "Tom H.",
        rating: 5,
        reviewText:
          "This is the exact smell of the woods behind my childhood house after a storm. I stood in my kitchen genuinely unable to speak.",
        emotionTags: ["nostalgia", "awe", "childhood"],
        isNostalgic: true,
      },
      {
        authorName: "Priya S.",
        rating: 4,
        reviewText: "Very green, very honest. Reads more like a place than a perfume.",
        emotionTags: ["calm"],
        isNostalgic: false,
      },
    ],
  },
  {
    name: "Citrus Verbena",
    category: "Cologne",
    description:
      "Grapefruit, verbena, and white tea — a bright, aspirational morning scent for people who make lists and actually finish them.",
    eraTag: null,
    scentFamily: "citrus",
    priceCents: 6200,
    reviews: [
      {
        authorName: "Alex M.",
        rating: 5,
        reviewText: "Sharp, clean, optimistic. My default before every interview.",
        emotionTags: ["confidence", "energy"],
        isNostalgic: false,
      },
      {
        authorName: "Hana Y.",
        rating: 4,
        reviewText:
          "Reminds me a little of the lemon soap in my aunt's summer house, but mostly it just smells like a good morning.",
        emotionTags: ["nostalgia", "freshness"],
        isNostalgic: true,
      },
    ],
  },
  {
    name: "Paper & Ink",
    category: "Eau de parfum",
    description:
      "Dry paper, iris, and a trace of India ink — the hush of a small-town library where the stamp card was still cardboard.",
    eraTag: "1990s",
    scentFamily: "powdery",
    priceCents: 8100,
    reviews: [
      {
        authorName: "George B.",
        rating: 5,
        reviewText:
          "I spent every Saturday of 1994 in the town library. This is that smell — the paper, the dust in sunlight, the quiet. Extraordinary.",
        emotionTags: ["nostalgia", "quiet", "study"],
        isNostalgic: true,
      },
      {
        authorName: "Lena F.",
        rating: 3,
        reviewText: "Interesting more than beautiful. Very dry — think archive, not garden.",
        emotionTags: ["curiosity"],
        isNostalgic: false,
      },
    ],
  },
  {
    name: "Monsoon Chai",
    category: "Eau de parfum",
    description:
      "Cardamom, black tea, ginger, and warm milk steam — a roadside chai stall while the first monsoon rain hammers the tarpaulin.",
    eraTag: "monsoon seasons",
    scentFamily: "spicy",
    priceCents: 8600,
    reviews: [
      {
        authorName: "Ravi T.",
        rating: 5,
        reviewText:
          "My college years were bus stops, borrowed umbrellas, and chai in glass tumblers. Whoever made this has stood where I stood.",
        emotionTags: ["nostalgia", "warmth", "rain"],
        isNostalgic: true,
      },
      {
        authorName: "Emma W.",
        rating: 4,
        reviewText: "Cozy and spiced without smelling like a candle. The milk note is impressively real.",
        emotionTags: ["comfort"],
        isNostalgic: false,
      },
    ],
  },
  {
    name: "Sea Salt Letters",
    category: "Eau de toilette",
    description:
      "Salt spray, driftwood, and sun-warmed cotton — postcards from a coastal town you visited once and never quite left.",
    eraTag: "first holidays",
    scentFamily: "aquatic",
    priceCents: 6900,
    reviews: [
      {
        authorName: "Nina P.",
        rating: 5,
        reviewText:
          "We took one family beach holiday, ever. This smells like the towel I refused to wash afterwards. I bought two bottles.",
        emotionTags: ["nostalgia", "family", "sea"],
        isNostalgic: true,
      },
      {
        authorName: "Chris D.",
        rating: 4,
        reviewText: "Clean marine scent that avoids the usual chemical sharpness. Wears light.",
        emotionTags: ["freshness"],
        isNostalgic: false,
      },
    ],
  },
];

async function main() {
  const voyageApiKey = process.env.VOYAGE_API_KEY;
  if (!voyageApiKey) throw new Error("VOYAGE_API_KEY is required to embed the seed catalog.");

  const db = getDb();

  const existing = await db.select().from(schema.products).limit(1);
  if (existing.length > 0) {
    console.log("Products already exist — skipping seed. (Truncate tables to re-seed.)");
    return;
  }

  for (const product of CATALOG) {
    const [inserted] = await db
      .insert(schema.products)
      .values({
        name: product.name,
        category: product.category,
        description: product.description,
        eraTag: product.eraTag,
        scentFamily: product.scentFamily,
        priceCents: product.priceCents,
      })
      .returning({ id: schema.products.id });

    if (!inserted) throw new Error(`Insert returned no row for ${product.name}`);

    await db.insert(schema.embeddings).values({
      sourceType: "product",
      sourceId: inserted.id,
      content: product.description,
      embedding: await embedText(product.description, "document", voyageApiKey),
      metadata: { category: product.category, productName: product.name },
    });

    for (const review of product.reviews) {
      const [insertedReview] = await db
        .insert(schema.reviews)
        .values({
          productId: inserted.id,
          authorName: review.authorName,
          rating: review.rating,
          reviewText: review.reviewText,
          sentiment: { overall: review.rating >= 4 ? "positive" : "mixed" },
          emotionTags: review.emotionTags,
          isNostalgic: review.isNostalgic,
        })
        .returning({ id: schema.reviews.id });

      if (!insertedReview) throw new Error(`Review insert returned no row for ${product.name}`);

      await db.insert(schema.embeddings).values({
        sourceType: "review",
        sourceId: insertedReview.id,
        content: review.reviewText,
        embedding: await embedText(review.reviewText, "document", voyageApiKey),
        metadata: {
          rating: review.rating,
          is_nostalgic: review.isNostalgic,
          productName: product.name,
        },
      });
    }

    console.log(`Seeded ${product.name} (${product.reviews.length} reviews)`);
  }

  console.log(`Done: ${CATALOG.length} products seeded with reviews and embeddings.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
