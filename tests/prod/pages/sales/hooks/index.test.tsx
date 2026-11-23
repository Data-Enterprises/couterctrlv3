import { describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";
import { useLastValidThreshold } from "@/pages/sales/prod/hooks";

/*
 * A cleared threshold box keeps grading on the last number typed, so rows do
 * not reshuffle until a new one is entered.
 */

describe("useLastValidThreshold", () => {
  it("starts on the fallback, takes a typed number, and holds it when cleared", () => {
    const { result, rerender } = renderHook(
      ({ amount }: { amount: number | null }) => useLastValidThreshold(amount),
      { initialProps: { amount: null as number | null } },
    );
    expect(result.current).toBe(9);
    rerender({ amount: 12 });
    expect(result.current).toBe(12);
    rerender({ amount: null });
    expect(result.current).toBe(12);
  });
});
