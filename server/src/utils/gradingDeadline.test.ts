import { describe, it, expect } from "vitest";
import {
  normalizeGradingDays,
  getGradingDeadline,
  getGradingPhase,
  findMissingGraders,
} from "./gradingDeadline.js";

const DAY = 24 * 60 * 60 * 1000;

describe("normalizeGradingDays", () => {
  it("uses the default (7) when the value is missing", () => {
    expect(normalizeGradingDays(undefined)).toBe(7);
    expect(normalizeGradingDays(null)).toBe(7);
  });

  it("uses the default when the value is not a usable number", () => {
    expect(normalizeGradingDays("abc")).toBe(7);
    expect(normalizeGradingDays(Number.NaN)).toBe(7);
    expect(normalizeGradingDays("14")).toBe(7);
  });

  it("keeps a valid number", () => {
    expect(normalizeGradingDays(10)).toBe(10);
  });

  it("rounds decimals", () => {
    expect(normalizeGradingDays(7.6)).toBe(8);
    expect(normalizeGradingDays(7.4)).toBe(7);
  });

  it("raises a value below the minimum to the minimum", () => {
    expect(normalizeGradingDays(0)).toBe(1);
    expect(normalizeGradingDays(-5)).toBe(1);
  });

  it("lowers a value above the maximum to the maximum", () => {
    expect(normalizeGradingDays(500)).toBe(60);
  });
});

describe("getGradingDeadline", () => {
  it("adds the days and ends at the end of that day", () => {
    const deadline = getGradingDeadline(new Date("2027-02-01T00:00:00.000Z"), 7);
    expect(deadline?.toISOString()).toBe("2027-02-08T23:59:59.999Z");
  });

  it("crosses a month boundary", () => {
    const deadline = getGradingDeadline(new Date("2027-01-30T00:00:00.000Z"), 7);
    expect(deadline?.toISOString()).toBe("2027-02-06T23:59:59.999Z");
  });

  it("crosses a year boundary", () => {
    const deadline = getGradingDeadline(new Date("2026-12-28T00:00:00.000Z"), 7);
    expect(deadline?.toISOString()).toBe("2027-01-04T23:59:59.999Z");
  });

  it("handles a leap year", () => {
    const deadline = getGradingDeadline(new Date("2028-02-25T00:00:00.000Z"), 7);
    expect(deadline?.toISOString()).toBe("2028-03-03T23:59:59.999Z");
  });

  it("ignores the time of day of the defense date", () => {
    const deadline = getGradingDeadline(new Date("2027-02-01T10:30:00.000Z"), 7);
    expect(deadline?.toISOString()).toBe("2027-02-08T23:59:59.999Z");
  });

  it("returns null when there is no defense date", () => {
    expect(getGradingDeadline(null, 7)).toBeNull();
    expect(getGradingDeadline(undefined, 7)).toBeNull();
  });

  it("returns null for an invalid date", () => {
    expect(getGradingDeadline(new Date("not a date"), 7)).toBeNull();
  });
});

describe("getGradingPhase", () => {
  const deadline = new Date("2027-02-08T23:59:59.999Z");

  it("is none when there is no deadline", () => {
    expect(getGradingPhase(null, new Date(), 2)).toBe("none");
  });

  it("is waiting when the deadline is far away", () => {
    expect(getGradingPhase(deadline, new Date("2027-01-20T12:00:00.000Z"), 2)).toBe("waiting");
  });

  it("is reminder inside the reminder window", () => {
    const now = new Date(deadline.getTime() - DAY);
    expect(getGradingPhase(deadline, now, 2)).toBe("reminder");
  });

  it("is reminder exactly at the start of the window", () => {
    const now = new Date(deadline.getTime() - 2 * DAY);
    expect(getGradingPhase(deadline, now, 2)).toBe("reminder");
  });

  it("is still reminder exactly at the deadline", () => {
    expect(getGradingPhase(deadline, new Date(deadline.getTime()), 2)).toBe("reminder");
  });

  it("is overdue right after the deadline", () => {
    const now = new Date(deadline.getTime() + 1);
    expect(getGradingPhase(deadline, now, 2)).toBe("overdue");
  });

  it("with 0 reminder days, the reminder starts only at the deadline itself", () => {
    expect(getGradingPhase(deadline, new Date(deadline.getTime() - 1), 0)).toBe("waiting");
    expect(getGradingPhase(deadline, new Date(deadline.getTime()), 0)).toBe("reminder");
  });
});

describe("findMissingGraders", () => {
  it("returns nobody when everyone has graded", () => {
    expect(findMissingGraders(["tutor", "a", "b"], ["b", "tutor", "a"])).toEqual([]);
  });

  it("returns the one who is missing", () => {
    expect(findMissingGraders(["tutor", "a", "b"], ["tutor", "b"])).toEqual(["a"]);
  });

  it("returns everyone when nobody has graded", () => {
    expect(findMissingGraders(["tutor", "a", "b"], [])).toEqual(["tutor", "a", "b"]);
  });

  it("ignores graded ids that were not expected", () => {
    expect(findMissingGraders(["tutor", "a"], ["tutor", "a", "stranger"])).toEqual([]);
  });

  it("does not repeat an id that is listed twice", () => {
    expect(findMissingGraders(["a", "a", "b"], [])).toEqual(["a", "b"]);
  });

  it("returns nobody when nobody is expected", () => {
    expect(findMissingGraders([], ["a"])).toEqual([]);
  });
});