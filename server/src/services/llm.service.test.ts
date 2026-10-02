import { describe, it, expect } from "vitest";
import { cosineSimilarity } from "./llm.service.js";

describe("cosineSimilarity", () => {
  it("returns 1 for identical vectors", () => {
    const a = [1, 2, 3];
    const b = [1, 2, 3];
    expect(cosineSimilarity(a, b)).toBeCloseTo(1, 5);
  });

  it("returns 0 for orthogonal vectors", () => {
    const a = [1, 0];
    const b = [0, 1];
    expect(cosineSimilarity(a, b)).toBeCloseTo(0, 5);
  });

  it("returns -1 for exactly opposite vectors", () => {
    const a = [1, 2, 3];
    const b = [-1, -2, -3];
    expect(cosineSimilarity(a, b)).toBeCloseTo(-1, 5);
  });

  it("returns a high similarity for very similar (not identical) vectors", () => {
    const a = [1, 2, 3];
    const b = [1, 2, 3.1];
    const result = cosineSimilarity(a, b);
    expect(result).toBeGreaterThan(0.99);
  });

  it("returns 0 when either vector is all zeros", () => {
    const a = [0, 0, 0];
    const b = [1, 2, 3];
    expect(cosineSimilarity(a, b)).toBe(0);
  });

  it("throws if vectors have different lengths", () => {
    const a = [1, 2, 3];
    const b = [1, 2];
    expect(() => cosineSimilarity(a, b)).toThrow("Vectors must be the same length");
  });
});