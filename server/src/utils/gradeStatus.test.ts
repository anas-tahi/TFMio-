import { describe, it, expect } from "vitest";
import { isPassing, gradeLabel } from "./gradeStatus.js";

describe("isPassing", () => {
  it("passes at exactly 5", () => {
    expect(isPassing(5)).toBe(true);
  });

  it("passes above 5", () => {
    expect(isPassing(7.85)).toBe(true);
  });

  it("fails just below 5", () => {
    expect(isPassing(4.99)).toBe(false);
  });

  it("fails at 0", () => {
    expect(isPassing(0)).toBe(false);
  });
});

describe("gradeLabel", () => {
  it("labels passing grades as Aprobado", () => {
    expect(gradeLabel(5)).toBe("Aprobado");
    expect(gradeLabel(10)).toBe("Aprobado");
  });

  it("labels failing grades as Suspenso", () => {
    expect(gradeLabel(4.99)).toBe("Suspenso");
    expect(gradeLabel(0)).toBe("Suspenso");
  });
});