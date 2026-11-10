import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import PairedBars from "@/components-dev/mobile/perf/PairedBars";
import { DOWN_COLOR, TY_COLOR, UP_COLOR } from "@/components-dev/mobile/perf/perfColors";

/** The colour of the TY bar: the first filled bar drawn. */
const tyColour = (ui: React.ReactElement) => {
  const { container } = render(ui);
  const bar = container.querySelector<HTMLElement>("span[style*='background']");
  return bar?.style.background ?? "";
};

const rgb = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`;
};

describe("PairedBars colour", () => {
  it("grades against last year when it has a figure", () => {
    expect(tyColour(<PairedBars ty={90} ly={100} lw={50} max={100} />)).toBe(
      rgb(DOWN_COLOR),
    );
  });

  it("falls back to last week when last year is zero", () => {
    // The department-key row: $1.69 last week, nothing this week or last
    // year. The change figure reads -100% against last week; the bar agrees.
    expect(tyColour(<PairedBars ty={0} ly={0} lw={1.69} max={2} />)).toBe(
      rgb(DOWN_COLOR),
    );
  });

  it("falls back to last week when last year has no history", () => {
    expect(
      tyColour(<PairedBars ty={10} ly={0} lyUnavailable lw={5} max={10} />),
    ).toBe(rgb(UP_COLOR));
  });

  it("still reads a zero last year as a rise when no last week is drawn", () => {
    expect(tyColour(<PairedBars ty={10} ly={0} max={10} />)).toBe(rgb(UP_COLOR));
  });

  it("stays neutral with nothing on file at all", () => {
    expect(
      tyColour(<PairedBars ty={10} ly={0} lyUnavailable lw={0} lwUnavailable max={10} />),
    ).toBe(rgb(TY_COLOR));
  });
});
