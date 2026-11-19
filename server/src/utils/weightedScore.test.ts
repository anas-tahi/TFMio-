import { describe, it, expect } from "vitest";
import {
  calculateWeightedScore,
  type RubricCriterion,
  type WeightedScoreResult,
} from "./weightedScore.js";

const tutorRubric: RubricCriterion[] = [
  { name: "Calidad técnica", maxPoints: 10, weight: 2 },
  { name: "Documentación", maxPoints: 10, weight: 1 },
  { name: "Metodología", maxPoints: 5, weight: 1 },
];

const juryRubric: RubricCriterion[] = [
  { name: "Presentación", maxPoints: 10, weight: 2 },
  { name: "Dominio del tema", maxPoints: 10, weight: 1 },
  { name: "Respuestas a preguntas", maxPoints: 10, weight: 1 },
];

const fourItems: RubricCriterion[] = [
  { name: "A", maxPoints: 10, weight: 1 },
  { name: "B", maxPoints: 10, weight: 1 },
  { name: "C", maxPoints: 10, weight: 1 },
  { name: "D", maxPoints: 10, weight: 1 },
];

function expectOk(result: WeightedScoreResult) {
  if (!result.ok) throw new Error(`expected ok, got error: ${result.error}`);
  return result;
}

function expectError(result: WeightedScoreResult) {
  if (result.ok) throw new Error("expected an error, got ok");
  return result.error;
}

describe("calculateWeightedScore", () => {
  it("reproduces the tutor example checked by hand (8, 6 and 4 of 5 -> 7.5)", () => {
    const result = expectOk(
      calculateWeightedScore(
        tutorRubric,
        [
          { name: "Calidad técnica", points: 8 },
          { name: "Documentación", points: 6 },
          { name: "Metodología", points: 4 },
        ],
        2
      )
    );
    expect(result.weightedScore).toBeCloseTo(7.5, 10);
    expect(result.notEvaluated).toEqual([]);
  });

  it("reproduces the jury example checked by hand (9, 8 and 6 -> 8)", () => {
    const result = expectOk(
      calculateWeightedScore(
        juryRubric,
        [
          { name: "Presentación", points: 9 },
          { name: "Dominio del tema", points: 8 },
          { name: "Respuestas a preguntas", points: 6 },
        ],
        0
      )
    );
    expect(result.weightedScore).toBeCloseTo(8, 10);
  });

  it("scales a criterion with a different maximum to 0-10", () => {
    const result = expectOk(
      calculateWeightedScore(
        [{ name: "X", maxPoints: 5, weight: 1 }],
        [{ name: "X", points: 4 }],
        0
      )
    );
    expect(result.weightedScore).toBeCloseTo(8, 10);
  });

  it("treats a score of 0 as a real score, not as missing", () => {
    const result = expectOk(
      calculateWeightedScore(
        tutorRubric,
        [
          { name: "Calidad técnica", points: 0 },
          { name: "Documentación", points: 0 },
          { name: "Metodología", points: 0 },
        ],
        2
      )
    );
    expect(result.weightedScore).toBe(0);
    expect(result.notEvaluated).toEqual([]);
  });

  it("rescales over the remaining items when one is not evaluated", () => {
    const result = expectOk(
      calculateWeightedScore(
        tutorRubric,
        [
          { name: "Calidad técnica", points: 8 },
          { name: "Documentación", points: 6 },
          { name: "Metodología", notEvaluated: true },
        ],
        2
      )
    );
    // (8 * 2 + 6 * 1) / (2 + 1)
    expect(result.weightedScore).toBeCloseTo(22 / 3, 6);
  });

  it("reports which items were not evaluated", () => {
    const result = expectOk(
      calculateWeightedScore(
        tutorRubric,
        [
          { name: "Calidad técnica", points: 8 },
          { name: "Documentación", points: 6 },
          { name: "Metodología", notEvaluated: true },
        ],
        2
      )
    );
    expect(result.notEvaluated).toEqual(["Metodología"]);
  });

  it("allows leaving two items unevaluated", () => {
    const result = expectOk(
      calculateWeightedScore(
        fourItems,
        [
          { name: "A", points: 8 },
          { name: "B", points: 6 },
          { name: "C", notEvaluated: true },
          { name: "D", notEvaluated: true },
        ],
        2
      )
    );
    expect(result.weightedScore).toBeCloseTo(7, 10);
  });

  it("rejects leaving more items unevaluated than allowed", () => {
    const error = expectError(
      calculateWeightedScore(
        fourItems,
        [
          { name: "A", notEvaluated: true },
          { name: "B", points: 5 },
          { name: "C", notEvaluated: true },
          { name: "D", notEvaluated: true },
        ],
        2
      )
    );
    expect(error).toContain("2");
  });

  it("does not allow leaving items unevaluated when the limit is 0 (committee members)", () => {
    const error = expectError(
      calculateWeightedScore(
        juryRubric,
        [
          { name: "Presentación", points: 9 },
          { name: "Dominio del tema", notEvaluated: true },
          { name: "Respuestas a preguntas", points: 6 },
        ],
        0
      )
    );
    expect(error).toMatch(/evaluarse/);
  });

  it("requires at least one evaluated item", () => {
    const error = expectError(
      calculateWeightedScore(
        tutorRubric,
        [
          { name: "Calidad técnica", notEvaluated: true },
          { name: "Documentación", notEvaluated: true },
          { name: "Metodología", notEvaluated: true },
        ],
        3
      )
    );
    expect(error).toMatch(/al menos un criterio/);
  });

  it("rejects a missing score instead of counting it as 0", () => {
    const error = expectError(
      calculateWeightedScore(
        tutorRubric,
        [
          { name: "Calidad técnica", points: 8 },
          { name: "Metodología", points: 4 },
        ],
        2
      )
    );
    expect(error).toContain("Documentación");
  });

  it("rejects null points that are not marked as not evaluated", () => {
    const error = expectError(
      calculateWeightedScore(
        tutorRubric,
        [
          { name: "Calidad técnica", points: 8 },
          { name: "Documentación", points: null },
          { name: "Metodología", points: 4 },
        ],
        2
      )
    );
    expect(error).toContain("Documentación");
  });

  it("rejects points above the maximum", () => {
    const error = expectError(
      calculateWeightedScore(
        tutorRubric,
        [
          { name: "Calidad técnica", points: 8 },
          { name: "Documentación", points: 6 },
          { name: "Metodología", points: 6 },
        ],
        2
      )
    );
    expect(error).toContain("Metodología");
    expect(error).toContain("0 y 5");
  });

  it("rejects negative points", () => {
    const error = expectError(
      calculateWeightedScore(
        tutorRubric,
        [
          { name: "Calidad técnica", points: -1 },
          { name: "Documentación", points: 6 },
          { name: "Metodología", points: 4 },
        ],
        2
      )
    );
    expect(error).toContain("Calidad técnica");
  });

  it("rejects points that are not a finite number", () => {
    const error = expectError(
      calculateWeightedScore(
        tutorRubric,
        [
          { name: "Calidad técnica", points: Number.NaN },
          { name: "Documentación", points: 6 },
          { name: "Metodología", points: 4 },
        ],
        2
      )
    );
    expect(error).toContain("Calidad técnica");
  });

  it("rejects a criterion whose maximum is not valid", () => {
    const error = expectError(
      calculateWeightedScore(
        [{ name: "X", maxPoints: 0, weight: 1 }],
        [{ name: "X", points: 5 }],
        0
      )
    );
    expect(error).toMatch(/máxima/);
  });

  it("ignores scores for criteria that are not in the rubric", () => {
    const result = expectOk(
      calculateWeightedScore(
        tutorRubric,
        [
          { name: "Calidad técnica", points: 8 },
          { name: "Documentación", points: 6 },
          { name: "Metodología", points: 4 },
          { name: "Otro criterio", points: 10 },
        ],
        2
      )
    );
    expect(result.weightedScore).toBeCloseTo(7.5, 10);
  });

  it("returns 0 when every evaluated weight is 0", () => {
    const result = expectOk(
      calculateWeightedScore(
        [{ name: "X", maxPoints: 10, weight: 0 }],
        [{ name: "X", points: 5 }],
        0
      )
    );
    expect(result.weightedScore).toBe(0);
  });
});