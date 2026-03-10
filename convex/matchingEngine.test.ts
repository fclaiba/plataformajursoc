import { describe, expect, it } from "vitest";
import { selectBestPairs } from "./matchingEngine";

describe("matchingEngine", () => {
  it("maximizes number of pairs first", () => {
    const nodes = ["A", "B", "C", "D"];
    const edges = [
      { left: "A", right: "B", score: 10 },
      { left: "B", right: "C", score: 1 },
      { left: "C", right: "D", score: 1 },
    ];

    const result = selectBestPairs(nodes, edges);
    expect(result.pairCount).toBe(2);
  });

  it("breaks ties by lower total priority score", () => {
    const nodes = ["A", "B", "C", "D"];
    const edges = [
      { left: "A", right: "B", score: 1 },
      { left: "C", right: "D", score: 1 },
      { left: "A", right: "C", score: 1 },
      { left: "B", right: "D", score: 4 },
    ];

    const result = selectBestPairs(nodes, edges);
    expect(result.pairCount).toBe(2);
    expect(result.totalScore).toBe(2);
  });
});
