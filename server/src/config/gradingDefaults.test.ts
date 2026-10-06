import { describe, it, expect } from "vitest";
import { DEFAULT_ROLE_WEIGHTS } from "./gradingDefaults.js";
import { calculateFinalGrade } from "../utils/gradeCalculator.js";

describe("DEFAULT_ROLE_WEIGHTS", () => {
  it("follows the official UGR split: tribunal 70%, tutor 30%", () => {
    expect(DEFAULT_ROLE_WEIGHTS.tutor).toBe(0.3);
    expect(DEFAULT_ROLE_WEIGHTS.jury).toBe(0.7);
  });

  it("adds up to 1", () => {
    expect(DEFAULT_ROLE_WEIGHTS.tutor + DEFAULT_ROLE_WEIGHTS.jury).toBeCloseTo(1, 10);
  });

  it("gives the expected final grade with the defaults (tutor 8, jury 7 -> 7.3)", () => {
    const result = calculateFinalGrade(8, [7], DEFAULT_ROLE_WEIGHTS.tutor, DEFAULT_ROLE_WEIGHTS.jury);
    expect(result).toBe(7.3);
  });

  it("lets the tribunal move the grade more than the tutor", () => {
    const tutorOnly = calculateFinalGrade(10, [0], DEFAULT_ROLE_WEIGHTS.tutor, DEFAULT_ROLE_WEIGHTS.jury);
    const juryOnly = calculateFinalGrade(0, [10], DEFAULT_ROLE_WEIGHTS.tutor, DEFAULT_ROLE_WEIGHTS.jury);
    expect(tutorOnly).toBe(3);
    expect(juryOnly).toBe(7);
  });
});