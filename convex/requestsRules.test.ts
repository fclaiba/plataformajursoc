import { describe, expect, it } from "vitest";
import {
  areReciprocallyMatched,
  canBeCompleted,
  shouldAutoCompleteAfterDoubleFinalize,
} from "./requestsRules";

describe("requestsRules", () => {
  it("detects reciprocal match consistency", () => {
    const left = { _id: "A", status: "MATCHED" as const, matchedRequestId: "B" };
    const right = { _id: "B", status: "MATCHED" as const, matchedRequestId: "A" };
    expect(areReciprocallyMatched(left, right)).toBe(true);
  });

  it("requires CONFIRMED status for completion", () => {
    const confirmedA = { _id: "A", status: "CONFIRMED" as const, matchedRequestId: "B" };
    const confirmedB = { _id: "B", status: "CONFIRMED" as const, matchedRequestId: "A" };
    const matchedB = { _id: "B", status: "MATCHED" as const, matchedRequestId: "A" };

    expect(canBeCompleted(confirmedA, confirmedB)).toBe(true);
    expect(canBeCompleted(confirmedA, matchedB)).toBe(false);
  });

  it("auto-completes only when both owners finalized", () => {
    const a = {
      _id: "A",
      userId: "user-a",
      status: "MATCHED" as const,
      matchedRequestId: "B",
      finalizedBy: ["user-a"],
    };
    const b = {
      _id: "B",
      userId: "user-b",
      status: "MATCHED" as const,
      matchedRequestId: "A",
      finalizedBy: ["user-b"],
    };
    const notFinalizedByB = {
      ...b,
      finalizedBy: [] as string[],
    };

    expect(shouldAutoCompleteAfterDoubleFinalize(a, b)).toBe(true);
    expect(shouldAutoCompleteAfterDoubleFinalize(a, notFinalizedByB)).toBe(false);
  });
});
