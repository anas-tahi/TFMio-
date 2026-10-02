/**
 * Pure calculation of the final grade from a tutor's score, a list of jury
 * scores, and each role's weight. Extracted from the grading controller so
 * it can be tested independently of the database.
 */
export function calculateFinalGrade(
  tutorScore: number,
  juryScores: number[],
  tutorWeight: number,
  juryWeight: number
): number {
  const juryAvg =
    juryScores.length > 0
      ? juryScores.reduce((sum, s) => sum + s, 0) / juryScores.length
      : 0;

  const totalWeight = tutorWeight + juryWeight;
  if (totalWeight === 0) return 0;

  const finalGrade = (tutorScore * tutorWeight + juryAvg * juryWeight) / totalWeight;
  return Math.round(finalGrade * 100) / 100;
}