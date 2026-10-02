import { describe, it, expect } from "vitest";
import { cosineSimilarity, buildProfileText } from "./llm.service.js";

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

describe("buildProfileText", () => {
  it("includes all fields when all are provided", () => {
    const text = buildProfileText({
      skills: ["Machine Learning", "NLP"],
      interests: "Recommender systems",
      workStyle: "Research-focused",
      degree: "MII",
    });
    expect(text).toContain("Degree: MII");
    expect(text).toContain("Skills: Machine Learning, NLP");
    expect(text).toContain("Research interests: Recommender systems");
    expect(text).toContain("Preferred work style: Research-focused");
  });

  it("omits fields that are missing", () => {
    const text = buildProfileText({ skills: ["Web Development"] });
    expect(text).toBe("Skills: Web Development");
  });

  it("returns an empty string when nothing is provided", () => {
    const text = buildProfileText({});
    expect(text).toBe("");
  });

  it("omits the skills line when the skills array is empty", () => {
    const text = buildProfileText({ skills: [], interests: "Something" });
    expect(text).toBe("Research interests: Something");
  });

  it("joins multiple fields with '. '", () => {
    const text = buildProfileText({
      skills: ["Databases"],
      interests: "Cloud systems",
    });
    expect(text).toBe("Skills: Databases. Research interests: Cloud systems");
  });
});