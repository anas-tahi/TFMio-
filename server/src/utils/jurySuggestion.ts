import { rankBySimilarity, toPercent } from "./similarity.js";

export interface JuryCandidate {
  tutorId: string;
  department: string;
  embedding?: number[];
}

export interface JurySuggestion {
  tutorId: string;
  department: string;
  score: number; // 0-100
}

/**
 * Suggests up to `count` jury members for a work, ranked by closeness to the
 * topic's embedding. The work's own tutor is always excluded. If the naive
 * top picks all come from the same department, the weakest of them is
 * swapped for the best candidate from a different department, as long as
 * that candidate's score isn't more than `maxScoreDrop` points below the
 * weakest naive pick. If no such candidate exists, the naive top picks are
 * kept as they are. Candidates with no usable embedding are skipped.
 */
export function suggestJury(
  topicEmbedding: number[],
  candidates: JuryCandidate[],
  excludeTutorId: string,
  count: number,
  maxScoreDrop: number
): JurySuggestion[] {
  const pool = candidates.filter((c) => c.tutorId !== excludeTutorId);
  const ranked = rankBySimilarity(topicEmbedding, pool, (c) => c.embedding);

  const top = ranked.slice(0, count).map((r) => ({
    tutorId: r.item.tutorId,
    department: r.item.department,
    score: toPercent(r.score),
  }));

  if (top.length < count) return top; // not enough candidates to diversify

  const departments = new Set(top.map((t) => t.department));
  if (departments.size > 1) return top; // already mixed, nothing to do

  const sameDepartment = top[0].department;
  const weakestScore = top[top.length - 1].score;

  const alternative = ranked
    .slice(count)
    .find(
      (r) =>
        r.item.department !== sameDepartment && toPercent(r.score) >= weakestScore - maxScoreDrop
    );

  if (!alternative) return top; // no close-enough alternative from another department

  return [
    ...top.slice(0, count - 1),
    {
      tutorId: alternative.item.tutorId,
      department: alternative.item.department,
      score: toPercent(alternative.score),
    },
  ];
}