import { describe, it, expect } from "vitest";
import { rankBySimilarity, toPercent, bestTutorScore } from "./similarity.js";

interface Candidate {
  id: string;
  emb?: number[];
}
const getEmb = (c: Candidate) => c.emb;

describe("rankBySimilarity", () => {
  const query = [1, 0];

  it("orders candidates from most to least similar", () => {
    const candidates: Candidate[] = [
      { id: "orthogonal", emb: [0, 1] },
      { id: "identical", emb: [1, 0] },
      { id: "diagonal", emb: [1, 1] },
    ];
    const ranked = rankBySimilarity(query, candidates, getEmb);
    expect(ranked.map((r) => r.item.id)).toEqual(["identical", "diagonal", "orthogonal"]);
  });

  it("skips candidates without an embedding", () => {
    const candidates: Candidate[] = [
      { id: "none" },
      { id: "empty", emb: [] },
      { id: "ok", emb: [1, 0] },
    ];
    const ranked = rankBySimilarity(query, candidates, getEmb);
    expect(ranked.map((r) => r.item.id)).toEqual(["ok"]);
  });

  it("skips candidates whose embedding has a different length instead of crashing", () => {
    const candidates: Candidate[] = [
      { id: "wrong-length", emb: [1, 0, 0] },
      { id: "ok", emb: [0, 1] },
    ];
    const ranked = rankBySimilarity(query, candidates, getEmb);
    expect(ranked.map((r) => r.item.id)).toEqual(["ok"]);
  });

  it("returns an empty list when there are no candidates", () => {
    expect(rankBySimilarity(query, [], getEmb)).toEqual([]);
  });
});

describe("toPercent", () => {
  it("rounds to the nearest whole number", () => {
    expect(toPercent(0.534)).toBe(53);
    expect(toPercent(0.536)).toBe(54);
  });

  it("never returns a negative percentage", () => {
    expect(toPercent(-0.4)).toBe(0);
  });

  it("returns 100 for identical texts, even with floating point noise", () => {
    expect(toPercent(1)).toBe(100);
    expect(toPercent(1.0000000000000002)).toBe(100);
  });
});

describe("bestTutorScore", () => {
  const query = [1, 0];

  it("uses a topic when it matches better than the profile", () => {
    const result = bestTutorScore(query, [0, 1], [[1, 0]]);
    expect(result?.source).toBe("topic");
    expect(result?.topicIndex).toBe(0);
    expect(result?.score).toBeCloseTo(1, 5);
  });

  it("uses the profile when it matches better than every topic", () => {
    const result = bestTutorScore(query, [1, 0], [[0, 1]]);
    expect(result?.source).toBe("profile");
    expect(result?.score).toBeCloseTo(1, 5);
  });

  it("returns null when the tutor has no usable signal", () => {
    expect(bestTutorScore(query, undefined, [])).toBeNull();
  });

  it("ignores signals whose length doesn't match the query", () => {
    const result = bestTutorScore(query, [1, 0, 0], [[1, 1]]);
    expect(result?.source).toBe("topic");
    expect(result?.score).toBeCloseTo(0.7071, 3);
  });

  it("takes the best signal, not the average", () => {
    const result = bestTutorScore(query, [1, 0], [[0, 1], [0, 1]]);
    expect(result?.score).toBeCloseTo(1, 5);
  });

  it("reports which topic matched best", () => {
    const result = bestTutorScore(query, [0, 1], [[0, 1], [1, 1], [1, 0]]);
    expect(result?.source).toBe("topic");
    expect(result?.topicIndex).toBe(2);
  });

  it("has no topic index when the profile wins", () => {
    const result = bestTutorScore(query, [1, 0], [[0, 1]]);
    expect(result?.source).toBe("profile");
    expect(result?.topicIndex).toBeUndefined();
  });
});