import { describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { NO_PICKS, type AccessPicks } from "@/pages/organization/dev/users/utils";
import { useSeededPicks } from "@/pages/organization/dev/users/create/hooks";

const holding = (baseGroups: number[]): AccessPicks => ({
  ...NO_PICKS,
  companies: [1],
  baseGroups,
  mode: "all",
});

describe("Edit's picks", () => {
  it("follow what the person holds as the reads land", () => {
    const { result, rerender } = renderHook(
      ({ held }) => useSeededPicks(true, held, { ...NO_PICKS, mode: "all" }),
      { initialProps: { held: holding([]) } },
    );
    rerender({ held: holding([10]) });
    expect(result.current.picks.baseGroups).toEqual([10]);
  });

  it("stay as the admin left them after a save that stopped part way", () => {
    const { result, rerender } = renderHook(
      ({ held }) => useSeededPicks(true, held, { ...NO_PICKS, mode: "all" }),
      { initialProps: { held: holding([10]) } },
    );
    // The admin adds group 11 and 12; one call fails.
    act(() => result.current.setPicks(holding([10, 11, 12])));
    act(() => result.current.keepPicks());
    // The re-read says 11 saved and 12 didn't.
    rerender({ held: holding([10, 11]) });
    expect(result.current.picks.baseGroups).toEqual([10, 11, 12]);
  });

  it("never seeds in Add", () => {
    const { result, rerender } = renderHook(
      ({ held }) => useSeededPicks(false, held, { ...NO_PICKS, mode: "all" }),
      { initialProps: { held: holding([]) } },
    );
    rerender({ held: holding([10]) });
    expect(result.current.picks.baseGroups).toEqual([]);
  });
});
