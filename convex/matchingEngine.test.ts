import { describe, expect, it } from "vitest";
import { selectBestMatches } from "./matchingEngine";

describe("matchingEngine", () => {
  it("maximizes number of people satisfied first", () => {
    const nodes = ["A", "B", "C", "D"];
    const edges = [
      { left: "A", right: "B", score: 10 },
      { left: "B", right: "C", score: 1 },
      { left: "C", right: "D", score: 1 },
    ];

    const result = selectBestMatches(nodes, edges, []);
    expect(result.peopleSatisfied).toBe(4); // A-B, C-D (wait, in greedy fallback B-C might get matched first depending on score per person)
    // Wait, with exact match DP, it explores all valid masks.
    // If it pairs B-C, it cannot pair A-B or C-D. people == 2.
    // If it pairs A-B and C-D, people == 4. Exact match maximizes people.
  });

  it("handles triplets correctly to maximize satisfaction", () => {
    const nodes = ["A", "B", "C", "D", "E"];
    const edges = [
      { left: "A", right: "D", score: 1 },
      { left: "D", right: "E", score: 1 },
    ];
    const triplets = [
      { n1: "A", n2: "B", n3: "C", score: 3 }
    ];

    const result = selectBestMatches(nodes, edges, triplets);
    
    // DP should pick triplet A-B-C (people=3) + pair D-E (people=2) = 5 people satisfied.
    // Pair A-D (2) + B-C is not an edge.
    expect(result.peopleSatisfied).toBe(5);
    expect(result.matches.some(m => m.type === "triplet")).toBe(true);
  });
});
