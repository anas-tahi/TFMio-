import { rankBySimilarity, RankedItem } from "./similarity.js";

/**
 * Candidates whose similarity to the query reaches the threshold, most similar
 * first, capped at `limit`. A candidate scoring exactly the threshold counts.
 */
export function findSimilarAboveThreshold<T>(
  query: number[],
  candidates: T[],
  getEmbedding: (candidate: T) => number[] | undefined,
  threshold: number,
  limit: number
): RankedItem<T>[] {
  return rankBySimilarity(query, candidates, getEmbedding)
    .filter((r) => r.score >= threshold)
    .slice(0, limit);
}