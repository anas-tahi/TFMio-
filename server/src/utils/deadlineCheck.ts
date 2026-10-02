/**
 * Pure check: has a given matching deadline already passed?
 * Extracted so it can be tested without touching the database.
 */
export function isPastDeadline(deadline: Date | null | undefined, now: Date = new Date()): boolean {
  if (!deadline) return false;
  return now > deadline;
}