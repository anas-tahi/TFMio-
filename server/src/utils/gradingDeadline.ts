import {
  DEFAULT_GRADING_DAYS,
  MIN_GRADING_DAYS,
  MAX_GRADING_DAYS,
} from "../config/gradingDeadline.js";

export type GradingPhase = "none" | "waiting" | "reminder" | "overdue";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * The number of days graders have after the defense. Anything that isn't a
 * usable number becomes the default; numbers are rounded and kept inside the
 * allowed range.
 */
export function normalizeGradingDays(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return DEFAULT_GRADING_DAYS;
  const rounded = Math.round(value);
  return Math.min(MAX_GRADING_DAYS, Math.max(MIN_GRADING_DAYS, rounded));
}

/**
 * The deadline for grading a work: the defense date plus `days` calendar days,
 * until the end of that day. Counted in UTC, which is how defense dates are
 * stored. Returns null when there is no valid defense date.
 */
export function getGradingDeadline(
  defenseDate: Date | null | undefined,
  days: number
): Date | null {
  if (!defenseDate || Number.isNaN(defenseDate.getTime())) return null;
  return new Date(
    Date.UTC(
      defenseDate.getUTCFullYear(),
      defenseDate.getUTCMonth(),
      defenseDate.getUTCDate() + days,
      23,
      59,
      59,
      999
    )
  );
}

/**
 * Where a work is relative to its grading deadline:
 * - none: no deadline (no defense date)
 * - waiting: the deadline is still far away
 * - reminder: inside the last `reminderDaysBefore` days (the deadline day included)
 * - overdue: the deadline has passed
 */
export function getGradingPhase(
  deadline: Date | null,
  now: Date,
  reminderDaysBefore: number
): GradingPhase {
  if (!deadline) return "none";
  const remaining = deadline.getTime() - now.getTime();
  if (remaining < 0) return "overdue";
  if (remaining <= reminderDaysBefore * DAY_MS) return "reminder";
  return "waiting";
}

/**
 * The people who should have graded but haven't, in the order they were
 * expected. Repeated ids count once, and ids that were not expected are ignored.
 */
export function findMissingGraders(expected: string[], graded: string[]): string[] {
  const done = new Set(graded);
  const seen = new Set<string>();
  const missing: string[] = [];

  for (const id of expected) {
    if (seen.has(id)) continue;
    seen.add(id);
    if (!done.has(id)) missing.push(id);
  }

  return missing;
}