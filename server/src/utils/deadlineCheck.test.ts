import { describe, it, expect } from "vitest";
import { isPastDeadline } from "./deadlineCheck.js";

describe("isPastDeadline", () => {
  it("returns false when there is no deadline set", () => {
    expect(isPastDeadline(null)).toBe(false);
    expect(isPastDeadline(undefined)).toBe(false);
  });

  it("returns true when the deadline is in the past", () => {
    const deadline = new Date("2020-01-01");
    const now = new Date("2026-01-01");
    expect(isPastDeadline(deadline, now)).toBe(true);
  });

  it("returns false when the deadline is in the future", () => {
    const deadline = new Date("2030-01-01");
    const now = new Date("2026-01-01");
    expect(isPastDeadline(deadline, now)).toBe(false);
  });

  it("returns false when now is exactly equal to the deadline", () => {
    const deadline = new Date("2026-01-01T12:00:00Z");
    const now = new Date("2026-01-01T12:00:00Z");
    expect(isPastDeadline(deadline, now)).toBe(false);
  });

  it("returns true one millisecond after the deadline", () => {
    const deadline = new Date("2026-01-01T12:00:00.000Z");
    const now = new Date("2026-01-01T12:00:00.001Z");
    expect(isPastDeadline(deadline, now)).toBe(true);
  });
});