import { calculateFinalGrade } from "./gradeCalculator.js";
import {
  MAX_EXTRA_DAYS,
  MIN_CLOSURE_REASON_LENGTH,
  MAX_CLOSURE_REASON_LENGTH,
} from "../config/gradingClosure.js";

/**
 * Final grade from the grades that exist when the coordinator closes a grade
 * with missing graders. The weight of a role with no grades is dropped, so the
 * result is rescaled over the roles that do have grades:
 * - tutor and committee: the normal weights (average of the members who graded)
 * - only the tutor: the tutor's score
 * - only the committee: the average of the members who graded
 * - nobody: null (there is nothing to close)
 * A tutor score of 0 is a real grade.
 */
export function calculatePartialFinalGrade(
  tutorScore: number | null,
  juryScores: number[],
  tutorWeight: number,
  juryWeight: number
): number | null {
  if (tutorScore !== null && juryScores.length > 0) {
    return calculateFinalGrade(tutorScore, juryScores, tutorWeight, juryWeight);
  }
  if (tutorScore !== null) {
    return calculateFinalGrade(tutorScore, [], 1, 0);
  }
  if (juryScores.length > 0) {
    return calculateFinalGrade(0, juryScores, 0, 1);
  }
  return null;
}

export type ClosureReasonResult = { ok: true; reason: string } | { ok: false; error: string };

/** The reason for closing a grade with missing graders: text, trimmed, 10 to 500 characters. */
export function validateClosureReason(value: unknown): ClosureReasonResult {
  if (typeof value !== "string") {
    return { ok: false, error: "Escribe el motivo del cierre" };
  }
  const reason = value.trim();
  if (reason.length < MIN_CLOSURE_REASON_LENGTH) {
    return {
      ok: false,
      error: `El motivo debe tener al menos ${MIN_CLOSURE_REASON_LENGTH} caracteres`,
    };
  }
  if (reason.length > MAX_CLOSURE_REASON_LENGTH) {
    return {
      ok: false,
      error: `El motivo no puede superar los ${MAX_CLOSURE_REASON_LENGTH} caracteres`,
    };
  }
  return { ok: true, reason };
}

export type ExtraDaysResult = { ok: true; days: number } | { ok: false; error: string };

/** Extra days for graders: a whole number from 1 to 30. A number written as text is not accepted. */
export function parseExtraDays(value: unknown): ExtraDaysResult {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    return { ok: false, error: "Indica un número entero de días" };
  }
  if (value < 1 || value > MAX_EXTRA_DAYS) {
    return { ok: false, error: `Los días extra deben estar entre 1 y ${MAX_EXTRA_DAYS}` };
  }
  return { ok: true, days: value };
}

/**
 * Why a grade cannot be closed with the grades received, or null if it can.
 * Closing only makes sense when someone is missing and at least one grade exists.
 */
export function getClosureBlocker(receivedCount: number, missingCount: number): string | null {
  if (missingCount <= 0) return "Todos han calificado: la nota final se calcula sola";
  if (receivedCount <= 0) {
    return "Todavía no hay ninguna calificación, así que no se puede cerrar";
  }
  return null;
}