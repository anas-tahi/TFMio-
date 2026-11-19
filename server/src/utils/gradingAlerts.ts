import type { GradingPhase } from "./gradingDeadline.js";

export type GradingAlert = "reminder" | "overdue" | null;

export interface GradingAlertInput {
  phase: GradingPhase;
  missingCount: number;
  reminderSent: boolean;
  overdueSent: boolean;
}

/**
 * What the hourly check should send for one work, if anything.
 * - Nobody missing: nothing.
 * - In the reminder window: one reminder to the people still missing.
 * - After the deadline: one message to the coordinator.
 * Each message is sent once; the flags say what was already sent.
 */
export function decideGradingAlert({
  phase,
  missingCount,
  reminderSent,
  overdueSent,
}: GradingAlertInput): GradingAlert {
  if (missingCount <= 0) return null;
  if (phase === "reminder" && !reminderSent) return "reminder";
  if (phase === "overdue" && !overdueSent) return "overdue";
  return null;
}

/** A list of names as a Spanish sentence: "A", "A y B", "A, B y C". */
export function joinNames(names: string[]): string {
  if (names.length === 0) return "";
  if (names.length === 1) return names[0];
  return `${names.slice(0, -1).join(", ")} y ${names[names.length - 1]}`;
}