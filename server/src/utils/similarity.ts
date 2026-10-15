import { cosineSimilarity } from "../services/llm.service.js";

export interface RankedItem<T> {
  item: T;
  score: number; // cosine similarity, between -1 and 1
}

/**
 * Ranks candidates by similarity to a query embedding, most similar first.
 * Candidates with a missing embedding, or one whose length differs from the
 * query (for example after changing the embedding model), are skipped
 * instead of crashing the whole request.
 */
export function rankBySimilarity<T>(
  query: number[],
  candidates: T[],
  getEmbedding: (candidate: T) => number[] | undefined
): RankedItem<T>[] {
  const ranked: RankedItem<T>[] = [];

  for (const item of candidates) {
    const embedding = getEmbedding(item);
    if (!embedding || embedding.length === 0 || embedding.length !== query.length) continue;
    ranked.push({ item, score: cosineSimilarity(query, embedding) });
  }

  return ranked.sort((a, b) => b.score - a.score);
}

/**
 * Converts a cosine similarity into the 0-100 percentage shown in the UI.
 * Clamped, because floating point can give 1.0000000000000002 and unrelated
 * texts can score below zero.
 */
export function toPercent(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score * 100)));
}

export interface TutorMatch {
  score: number;
  source: "profile" | "topic";
  /** Index into the topicEmbeddings array, set when source is "topic". */
  topicIndex?: number;
}

/**
 * Best similarity between a query and everything we know about a tutor: the
 * embedding of their profile plus the embeddings of their active topics.
 * We take the maximum, so one very relevant topic isn't diluted by an
 * unrelated profile. Returns null if the tutor has no usable signal at all.
 */
export function bestTutorScore(
  query: number[],
  profileEmbedding: number[] | undefined,
  topicEmbeddings: number[][]
): TutorMatch | null {
  const signals: {
    embedding: number[] | undefined;
    source: TutorMatch["source"];
    topicIndex?: number;
  }[] = [
    { embedding: profileEmbedding, source: "profile" },
    ...topicEmbeddings.map((embedding, topicIndex) => ({
      embedding,
      source: "topic" as const,
      topicIndex,
    })),
  ];

  let best: TutorMatch | null = null;
  for (const { embedding, source, topicIndex } of signals) {
    if (!embedding || embedding.length === 0 || embedding.length !== query.length) continue;
    const score = cosineSimilarity(query, embedding);
    if (best === null || score > best.score) best = { score, source, topicIndex };
  }

  return best;
}