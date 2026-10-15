import { describe, it, expect } from "vitest";
import { findSimilarAboveThreshold } from "./similarTopics.js";

interface Candidate {
  id: string;
  emb?: number[];
}
const getEmb = (c: Candidate) => c.emb;

describe("findSimilarAboveThreshold", () => {
  const query = [1, 0];

  it("keeps only candidates at or above the threshold, best first", () => {
    const candidates: Candidate[] = [
      { id: "a", emb: [0, 1] }, // 0
      { id: "b", emb: [1, 1] }, // about 0.71
      { id: "c", emb: [1, 0] }, // 1
      { id: "d", emb: [1, 2] }, // about 0.45
    ];
    const result = findSimilarAboveThreshold(query, candidates, getEmb, 0.7, 5);
    expect(result.map((r) => r.item.id)).toEqual(["c", "b"]);
  });

  it("includes a candidate whose score equals the threshold", () => {
    const result = findSimilarAboveThreshold(query, [{ id: "x", emb: [1, 0] }], getEmb, 1, 5);
    expect(result.map((r) => r.item.id)).toEqual(["x"]);
  });

  it("returns at most `limit` candidates", () => {
    const candidates: Candidate[] = [
      { id: "a", emb: [1, 0] },
      { id: "b", emb: [1, 0] },
      { id: "c", emb: [1, 0] },
    ];
    expect(findSimilarAboveThreshold(query, candidates, getEmb, 0.5, 2)).toHaveLength(2);
  });

  it("returns an empty list when nothing reaches the threshold", () => {
    const candidates: Candidate[] = [
      { id: "a", emb: [0, 1] },
      { id: "b", emb: [1, 2] },
    ];
    expect(findSimilarAboveThreshold(query, candidates, getEmb, 0.9, 5)).toEqual([]);
  });

  it("skips candidates without a usable embedding", () => {
    const candidates: Candidate[] = [
      { id: "none" },
      { id: "wrong-length", emb: [1, 0, 0] },
      { id: "ok", emb: [1, 0] },
    ];
    const result = findSimilarAboveThreshold(query, candidates, getEmb, 0.5, 5);
    expect(result.map((r) => r.item.id)).toEqual(["ok"]);
  });
});