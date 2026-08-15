export interface ProductRecord {
  id: string;
  name: string;
  category: string;
  description: string;
  eraTag: string | null;
  scentFamily: string | null;
  priceCents: number;
  imageUrl: string | null;
  createdAt: Date | null;
}

export interface ReviewRecord {
  id: string;
  productId: string | null;
  authorName: string;
  rating: number;
  reviewText: string;
  sentiment: unknown;
  emotionTags: string[] | null;
  isNostalgic: boolean | null;
  createdAt: Date | null;
}
