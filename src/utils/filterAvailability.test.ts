import { describe, it, expect } from "vitest";
import { markAvailability } from "./filterAvailability";

describe("markAvailability", () => {
  const opts = [
    { value: "a", label: "A" },
    { value: "b", label: "B" },
    { value: "c", label: "C" },
  ];

  it("marks what the other filters have ruled out", () => {
    const out = markAvailability(opts, new Set(["a"]), []);
    expect(out.map((o) => o.unavailable)).toEqual([false, true, true]);
  });

  it("leads with a pick of your own that has gone dead", () => {
    // It is the reason the screen is empty, and in a list of two thousand
    // items it is the one thing worth finding.
    const out = markAvailability(opts, new Set(["a"]), ["c"]);
    expect(out[0].value).toBe("c");
    expect(out[0].unavailable).toBe(true);
  });

  it("leaves the order alone when every pick still works", () => {
    const out = markAvailability(opts, new Set(["a", "b", "c"]), ["b"]);
    expect(out.map((o) => o.value)).toEqual(["a", "b", "c"]);
  });
});
