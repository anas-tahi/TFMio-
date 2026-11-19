import { describe, it, expect } from "vitest";
import {
  calculatePartialFinalGrade,
  validateClosureReason,
  parseExtraDays,
  getClosureBlocker,
} from "./gradeClosure.js";

function expectError(result: { ok: true } | { ok: false; error: string }): string {
  if (result.ok) throw new Error("expected an error, got ok");
  return result.error;
}

describe("calculatePartialFinalGrade", () => {
  it("uses both roles with their weights when the tutor and the committee graded", () => {
    // tutor 8, committee average 7 -> 0.3 * 8 + 0.7 * 7 = 7.3
    expect(calculatePartialFinalGrade(8, [6, 8], 0.3, 0.7)).toBe(7.3);
  });

  it("uses only the tutor when no committee member graded, ignoring the weights", () => {
    expect(calculatePartialFinalGrade(8, [], 0.3, 0.7)).toBe(8);
  });

  it("uses only the committee when the tutor did not grade", () => {
    expect(calculatePartialFinalGrade(null, [7], 0.3, 0.7)).toBe(7);
  });

  it("averages only the committee members who graded", () => {
    expect(calculatePartialFinalGrade(null, [6, 8], 0.3, 0.7)).toBe(7);
  });

  it("accepts a single committee member", () => {
    expect(calculatePartialFinalGrade(null, [9], 0.3, 0.7)).toBe(9);
  });

  it("returns null when nobody graded", () => {
    expect(calculatePartialFinalGrade(null, [], 0.3, 0.7)).toBeNull();
  });

  it("counts a tutor score of 0 as a real grade", () => {
    expect(calculatePartialFinalGrade(0, [], 0.3, 0.7)).toBe(0);
  });

  it("rounds to 2 decimal places", () => {
    expect(calculatePartialFinalGrade(null, [7, 8, 8], 0.3, 0.7)).toBe(7.67);
  });

  it("combines the tutor with a partial committee", () => {
    // tutor 8, one committee member with 6 -> 0.3 * 8 + 0.7 * 6 = 6.6
    expect(calculatePartialFinalGrade(8, [6], 0.3, 0.7)).toBe(6.6);
  });
});

describe("validateClosureReason", () => {
  it("accepts a normal reason", () => {
    expect(validateClosureReason("El tutor está de baja médica y no puede calificar.")).toEqual({
      ok: true,
      reason: "El tutor está de baja médica y no puede calificar.",
    });
  });

  it("trims spaces around the reason", () => {
    expect(validateClosureReason("  Motivo de prueba válido  ")).toEqual({
      ok: true,
      reason: "Motivo de prueba válido",
    });
  });

  it("rejects an empty reason", () => {
    expect(expectError(validateClosureReason(""))).toContain("al menos 10");
  });

  it("rejects a reason made only of spaces", () => {
    expect(expectError(validateClosureReason("            "))).toContain("al menos 10");
  });

  it("rejects a reason that is too short", () => {
    expect(expectError(validateClosureReason("corto"))).toContain("10");
  });

  it("rejects a value that is not text", () => {
    expect(expectError(validateClosureReason(undefined))).toContain("motivo");
    expect(expectError(validateClosureReason(12345678901))).toContain("motivo");
  });

  it("rejects a reason that is too long", () => {
    expect(expectError(validateClosureReason("a".repeat(501)))).toContain("500");
  });

  it("accepts a reason with exactly the minimum length", () => {
    expect(validateClosureReason("a".repeat(10)).ok).toBe(true);
  });

  it("accepts a reason with exactly the maximum length", () => {
    expect(validateClosureReason("a".repeat(500)).ok).toBe(true);
  });
});

describe("parseExtraDays", () => {
  it("accepts a normal number of days", () => {
    expect(parseExtraDays(7)).toEqual({ ok: true, days: 7 });
  });

  it("accepts the smallest and the largest allowed number", () => {
    expect(parseExtraDays(1)).toEqual({ ok: true, days: 1 });
    expect(parseExtraDays(30)).toEqual({ ok: true, days: 30 });
  });

  it("rejects 0", () => {
    expect(expectError(parseExtraDays(0))).toContain("entre 1 y 30");
  });

  it("rejects a negative number", () => {
    expect(expectError(parseExtraDays(-3))).toContain("entre 1 y 30");
  });

  it("rejects more than the maximum", () => {
    expect(expectError(parseExtraDays(31))).toContain("entre 1 y 30");
  });

  it("rejects decimals", () => {
    expect(expectError(parseExtraDays(2.5))).toContain("entero");
  });

  it("rejects a number written as text", () => {
    expect(expectError(parseExtraDays("7"))).toContain("entero");
  });

  it("rejects NaN and a missing value", () => {
    expect(expectError(parseExtraDays(Number.NaN))).toContain("entero");
    expect(expectError(parseExtraDays(undefined))).toContain("entero");
  });
});

describe("getClosureBlocker", () => {
  it("allows closing when someone graded and someone is missing", () => {
    expect(getClosureBlocker(2, 1)).toBeNull();
  });

  it("blocks closing when nobody is missing", () => {
    expect(getClosureBlocker(3, 0)).toContain("Todos han calificado");
  });

  it("blocks closing when nobody has graded", () => {
    expect(getClosureBlocker(0, 3)).toContain("ninguna calificación");
  });

  it("says everyone graded when both counts are 0", () => {
    expect(getClosureBlocker(0, 0)).toContain("Todos han calificado");
  });
});