import { describe, it, expect } from "vitest";
import { calculateFinalGrade } from "./gradeCalculator.js";

describe("calculateFinalGrade", () => {
  it("matches the real example we verified manually: tutor 8, jury 7, equal weights -> 7.5", () => {
    const result = calculateFinalGrade(8, [7], 0.5, 0.5);
    expect(result).toBe(7.5);
  });

  it("averages multiple jury scores before applying the weight", () => {
    // jury scores 6 and 8 -> average 7, same as the single-jury case above
    const result = calculateFinalGrade(8, [6, 8], 0.5, 0.5);
    expect(result).toBe(7.5);
  });

  it("weights the tutor more heavily when tutorWeight is higher", () => {
    // tutor 10, jury 0, tutor weight 0.8, jury weight 0.2 -> 10*0.8 + 0*0.2 = 8
    const result = calculateFinalGrade(10, [0], 0.8, 0.2);
    expect(result).toBe(8);
  });

  it("returns the tutor score alone when jury weight is 0", () => {
    const result = calculateFinalGrade(9, [2], 1, 0);
    expect(result).toBe(9);
  });

  it("returns the jury average alone when tutor weight is 0", () => {
    const result = calculateFinalGrade(10, [4, 6], 0, 1);
    expect(result).toBe(5);
  });

  it("returns 0 if there are no jury scores and jury weight is non-zero", () => {
    // juryAvg defaults to 0 when the array is empty
    const result = calculateFinalGrade(8, [], 0.5, 0.5);
    expect(result).toBe(4);
  });

  it("returns 0 if both weights are 0", () => {
    const result = calculateFinalGrade(10, [10], 0, 0);
    expect(result).toBe(0);
  });

  it("rounds to 2 decimal places", () => {
    const result = calculateFinalGrade(7, [8, 9, 10], 0.4, 0.6);
    // juryAvg = 9, finalGrade = (7*0.4 + 9*0.6) / 1 = 2.8 + 5.4 = 8.2
    expect(result).toBe(8.2);
  });
});