/** Minimum final grade (out of 10) needed to pass. */
export const PASS_MARK = 5;

/** True if the final grade is a pass (5.0 or above). */
export function isPassing(finalGrade: number): boolean {
  return finalGrade >= PASS_MARK;
}

/** Label shown to the student when the coordinator publishes the grade. */
export function gradeLabel(finalGrade: number): "Aprobado" | "Suspenso" {
  return isPassing(finalGrade) ? "Aprobado" : "Suspenso";
}