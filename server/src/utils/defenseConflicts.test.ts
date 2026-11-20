import { describe, it, expect } from "vitest";
import { findDefenseConflicts, type ScheduledDefense } from "./defenseConflicts.js";

function defense(partial: Partial<ScheduledDefense> & { workId: string }): ScheduledDefense {
  return {
    date: new Date("2027-02-01T00:00:00.000Z"),
    time: "10:30",
    room: "Sala 1",
    people: ["tutor1", "jury1"],
    ...partial,
  };
}

describe("findDefenseConflicts", () => {
  it("finds no conflict against an empty schedule", () => {
    const candidate = defense({ workId: "new" });
    expect(findDefenseConflicts(candidate, [])).toEqual([]);
  });

  it("finds no conflict when nothing overlaps in time", () => {
    const candidate = defense({ workId: "new", time: "10:30" });
    const existing = [defense({ workId: "other", time: "12:00" })];
    expect(findDefenseConflicts(candidate, existing)).toEqual([]);
  });

  it("finds no conflict on a different day, same time and room", () => {
    const candidate = defense({ workId: "new", date: new Date("2027-02-01T00:00:00.000Z") });
    const existing = [defense({ workId: "other", date: new Date("2027-02-02T00:00:00.000Z") })];
    expect(findDefenseConflicts(candidate, existing)).toEqual([]);
  });

  it("detects a room conflict at the exact same time", () => {
    const candidate = defense({ workId: "new", room: "Sala 1", people: ["tutorA"] });
    const existing = [defense({ workId: "other", room: "Sala 1", people: ["tutorB"] })];
    const result = findDefenseConflicts(candidate, existing);
    expect(result).toEqual([{ type: "room", withWorkId: "other", detail: "Sala 1" }]);
  });

  it("does not flag a room conflict for a different room", () => {
    const candidate = defense({ workId: "new", room: "Sala 1", people: ["tutorA"] });
    const existing = [defense({ workId: "other", room: "Sala 2", people: ["tutorB"] })];
    expect(findDefenseConflicts(candidate, existing)).toEqual([]);
  });

  it("matches room names regardless of case and surrounding spaces", () => {
    const candidate = defense({ workId: "new", room: " sala 1 ", people: ["tutorA"] });
    const existing = [defense({ workId: "other", room: "Sala 1", people: ["tutorB"] })];
    const result = findDefenseConflicts(candidate, existing);
    expect(result.some((c) => c.type === "room")).toBe(true);
  });

  it("detects a person conflict (shared tutor or jury member)", () => {
    const candidate = defense({ workId: "new", room: "Sala 1", people: ["miguel", "ana"] });
    const existing = [defense({ workId: "other", room: "Sala 2", people: ["miguel", "ramon"] })];
    const result = findDefenseConflicts(candidate, existing);
    expect(result).toEqual([{ type: "person", withWorkId: "other", detail: "miguel" }]);
  });

  it("reports every shared person, not just the first", () => {
    const candidate = defense({ workId: "new", room: "Sala 1", people: ["miguel", "ana"] });
    const existing = [defense({ workId: "other", room: "Sala 2", people: ["miguel", "ana"] })];
    const result = findDefenseConflicts(candidate, existing);
    expect(result).toHaveLength(2);
    expect(result.map((c) => c.detail).sort()).toEqual(["ana", "miguel"]);
  });

  it("can report both a room conflict and a person conflict against the same other defense", () => {
    const candidate = defense({ workId: "new", room: "Sala 1", people: ["miguel"] });
    const existing = [defense({ workId: "other", room: "Sala 1", people: ["miguel"] })];
    const result = findDefenseConflicts(candidate, existing);
    expect(result).toHaveLength(2);
  });

  it("detects overlap when slots partially overlap, not just when identical", () => {
    // candidate 10:30-11:15, other 11:00-11:45 -> they overlap 11:00-11:15
    const candidate = defense({ workId: "new", time: "10:30", room: "Sala 1" });
    const existing = [defense({ workId: "other", time: "11:00", room: "Sala 1" })];
    const result = findDefenseConflicts(candidate, existing);
    expect(result.some((c) => c.type === "room")).toBe(true);
  });

  it("finds no conflict when slots are back-to-back with no overlap", () => {
    // candidate 10:30-11:15, other 11:15-12:00 -> touching, not overlapping
    const candidate = defense({ workId: "new", time: "10:30", room: "Sala 1" });
    const existing = [defense({ workId: "other", time: "11:15", room: "Sala 1" })];
    expect(findDefenseConflicts(candidate, existing)).toEqual([]);
  });

  it("never flags a defense against itself (same workId)", () => {
    const candidate = defense({ workId: "same", room: "Sala 1", people: ["miguel"] });
    const existing = [defense({ workId: "same", room: "Sala 1", people: ["miguel"] })];
    expect(findDefenseConflicts(candidate, existing)).toEqual([]);
  });

  it("checks against several existing defenses at once", () => {
    const candidate = defense({ workId: "new", room: "Sala 3", people: ["ana"] });
    const existing = [
      defense({ workId: "a", room: "Sala 1", people: ["miguel"] }),
      defense({ workId: "b", room: "Sala 2", people: ["ramon"] }),
      defense({ workId: "c", room: "Sala 3", people: ["david"] }),
    ];
    const result = findDefenseConflicts(candidate, existing);
    expect(result).toEqual([{ type: "room", withWorkId: "c", detail: "Sala 3" }]);
  });
});