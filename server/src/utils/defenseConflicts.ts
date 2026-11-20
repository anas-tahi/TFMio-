import { DEFENSE_SLOT_MINUTES } from "../config/defenseSlot.js";

export interface ScheduledDefense {
  workId: string;
  date: Date; // calendar day only; the time of day on this Date is ignored
  time: string; // "HH:MM", 24-hour
  room: string;
  people: string[]; // tutor + jury member ids, as strings
}

export interface DefenseConflict {
  type: "room" | "person";
  withWorkId: string;
  detail: string; // the room name, or the person's id, whichever clashed
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}

function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function slotsOverlap(timeA: string, timeB: string): boolean {
  const startA = toMinutes(timeA);
  const startB = toMinutes(timeB);
  return startA < startB + DEFENSE_SLOT_MINUTES && startB < startA + DEFENSE_SLOT_MINUTES;
}

/**
 * Checks a candidate defense against every already-scheduled one. Returns the
 * list of conflicts found (empty if none): a room booked twice, or a person
 * (tutor or jury member) booked in two overlapping defenses. Comparisons are
 * case-insensitive and trimmed for room names, since "Sala 1" and "sala 1 "
 * are the same room. A defense is never compared against itself (matched by
 * workId), so re-saving the same work with the same data is never a conflict
 * with its own old slot.
 */
export function findDefenseConflicts(
  candidate: ScheduledDefense,
  existing: ScheduledDefense[]
): DefenseConflict[] {
  const conflicts: DefenseConflict[] = [];
  const candidateRoom = candidate.room.trim().toLowerCase();
  const candidatePeople = new Set(candidate.people);

  for (const other of existing) {
    if (other.workId === candidate.workId) continue;
    if (!sameDay(candidate.date, other.date)) continue;
    if (!slotsOverlap(candidate.time, other.time)) continue;

    if (other.room.trim().toLowerCase() === candidateRoom) {
      conflicts.push({ type: "room", withWorkId: other.workId, detail: other.room });
    }

    for (const person of other.people) {
      if (candidatePeople.has(person)) {
        conflicts.push({ type: "person", withWorkId: other.workId, detail: person });
      }
    }
  }

  return conflicts;
}