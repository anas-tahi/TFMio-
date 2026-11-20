import { describe, it, expect } from "vitest";
import { suggestJury, type JuryCandidate } from "./jurySuggestion.js";

const topic = [1, 0];

function candidate(id: string, department: string, embedding: number[]): JuryCandidate {
  return { tutorId: id, department, embedding };
}

describe("suggestJury", () => {
  it("picks the top 3 by closeness when departments are already mixed", () => {
    const candidates = [
      candidate("a", "DECSAI", [1, 0]), // 100%
      candidate("b", "LSI", [0.9, 0.1]), // close
      candidate("c", "DECSAI", [0.8, 0.2]),
      candidate("d", "LSI", [0, 1]), // far
    ];
    const result = suggestJury(topic, candidates, "none", 3, 15);
    expect(result.map((r) => r.tutorId)).toEqual(["a", "b", "c"]);
  });

  it("excludes the work's own tutor, even if they would rank highest", () => {
    const candidates = [
      candidate("tutor", "DECSAI", [1, 0]),
      candidate("a", "DECSAI", [0.9, 0.1]),
      candidate("b", "LSI", [0.8, 0.2]),
      candidate("c", "LSI", [0.7, 0.3]),
    ];
    const result = suggestJury(topic, candidates, "tutor", 3, 15);
    expect(result.map((r) => r.tutorId)).toEqual(["a", "b", "c"]);
  });

  it("swaps the weakest pick for a close alternative from another department", () => {
    const candidates = [
      candidate("a", "DECSAI", [1, 0]), // 100%
      candidate("b", "DECSAI", [0.95, 0.05]), // ~95%
      candidate("c", "DECSAI", [0.9, 0.1]), // ~90%, weakest of the naive top 3
      candidate("d", "LSI", [0.85, 0.15]), // ~85%, within 15 points of 90
    ];
    const result = suggestJury(topic, candidates, "none", 3, 15);
    expect(result.map((r) => r.tutorId)).toEqual(["a", "b", "d"]);
    expect(new Set(result.map((r) => r.department)).size).toBe(2);
  });

  it("does not swap when the only alternative scores too far below", () => {
    const candidates = [
      candidate("a", "DECSAI", [1, 0]),
      candidate("b", "DECSAI", [0.95, 0.05]),
      candidate("c", "DECSAI", [0.9, 0.1]),
      candidate("d", "LSI", [0, 1]), // far below, score drop too big
    ];
    const result = suggestJury(topic, candidates, "none", 3, 15);
    expect(result.map((r) => r.tutorId)).toEqual(["a", "b", "c"]);
  });

  it("keeps the naive top picks when no other department has any candidate", () => {
    const candidates = [
      candidate("a", "DECSAI", [1, 0]),
      candidate("b", "DECSAI", [0.9, 0.1]),
      candidate("c", "DECSAI", [0.8, 0.2]),
    ];
    const result = suggestJury(topic, candidates, "none", 3, 15);
    expect(result.map((r) => r.tutorId)).toEqual(["a", "b", "c"]);
  });

  it("returns fewer than count when there are not enough candidates", () => {
    const candidates = [candidate("a", "DECSAI", [1, 0]), candidate("b", "LSI", [0.9, 0.1])];
    const result = suggestJury(topic, candidates, "none", 3, 15);
    expect(result).toHaveLength(2);
  });

  it("returns an empty list when there are no usable candidates", () => {
    const result = suggestJury(topic, [], "none", 3, 15);
    expect(result).toEqual([]);
  });

  it("skips candidates without an embedding", () => {
    const candidates = [
      candidate("a", "DECSAI", [1, 0]),
      { tutorId: "b", department: "LSI" }, // no embedding
      candidate("c", "DECSAI", [0.8, 0.2]),
    ];
    const result = suggestJury(topic, candidates, "none", 3, 15);
    expect(result.map((r) => r.tutorId)).toEqual(["a", "c"]);
  });

  it("includes a swap candidate exactly at the score-drop boundary", () => {
    // weakest naive pick scores 90, alternative scores exactly 75 (90 - 15)
    const candidates = [
      candidate("a", "DECSAI", [1, 0]),
      candidate("b", "DECSAI", [0.95, 0.05]),
      candidate("c", "DECSAI", [0.9, 0.1]),
      candidate("d", "LSI", [0.75, 0.25]),
    ];
    const result = suggestJury(topic, candidates, "none", 3, 15);
    expect(result.some((r) => r.tutorId === "d")).toBe(true);
  });
});