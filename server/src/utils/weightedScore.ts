export interface RubricCriterion {
  name: string;
  maxPoints: number;
  weight: number;
}

export interface ScoreInput {
  name: string;
  points?: number | null;
  notEvaluated?: boolean;
}

export type WeightedScoreResult =
  | { ok: true; weightedScore: number; notEvaluated: string[] }
  | { ok: false; error: string };

/**
 * One grader's score (0 to 10) from their per-criterion points.
 *
 * - Each criterion is scaled to 0-10 and weighted.
 * - A criterion marked `notEvaluated` is left out, so the result is rescaled
 *   over the weights of the criteria that were evaluated.
 * - At most `maxNotEvaluated` criteria may be left out, and at least one must
 *   be evaluated.
 * - A missing score, or points outside 0..maxPoints, is an error. A score of 0
 *   is a real score.
 */
export function calculateWeightedScore(
  criteria: RubricCriterion[],
  scores: ScoreInput[],
  maxNotEvaluated: number
): WeightedScoreResult {
  const byName = new Map(scores.map((s) => [s.name, s]));

  let weightedSum = 0;
  let weightTotal = 0;
  const notEvaluated: string[] = [];

  for (const criterion of criteria) {
    if (!(criterion.maxPoints > 0)) {
      return {
        ok: false,
        error: `El criterio «${criterion.name}» tiene una puntuación máxima no válida`,
      };
    }

    const given = byName.get(criterion.name);

    if (given?.notEvaluated) {
      notEvaluated.push(criterion.name);
      continue;
    }

    const points = given?.points;
    if (points === undefined || points === null) {
      return { ok: false, error: `Falta la puntuación de «${criterion.name}»` };
    }
    if (
      typeof points !== "number" ||
      !Number.isFinite(points) ||
      points < 0 ||
      points > criterion.maxPoints
    ) {
      return {
        ok: false,
        error: `La puntuación de «${criterion.name}» debe estar entre 0 y ${criterion.maxPoints}`,
      };
    }

    weightedSum += (points / criterion.maxPoints) * 10 * criterion.weight;
    weightTotal += criterion.weight;
  }

  if (notEvaluated.length > maxNotEvaluated) {
    return {
      ok: false,
      error:
        maxNotEvaluated === 0
          ? "Todos los criterios deben evaluarse"
          : `Solo se pueden dejar sin evaluar hasta ${maxNotEvaluated} criterios`,
    };
  }
  if (notEvaluated.length === criteria.length) {
    return { ok: false, error: "Debes evaluar al menos un criterio" };
  }

  return {
    ok: true,
    weightedScore: weightTotal > 0 ? weightedSum / weightTotal : 0,
    notEvaluated,
  };
}