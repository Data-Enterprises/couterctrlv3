import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import ConcentratedNote from "@/pages/sales/dev/storePanel/subDepts/components/ConcentratedNote";
import HashNote from "@/pages/sales/dev/storePanel/subDepts/components/HashNote";
import NotComparedNote from "@/pages/sales/dev/storePanel/subDepts/components/NotComparedNote";
import type { ReportRow } from "@/pages/sales/dev/utils/deptReport";

/*
 * The department comparison's notes: where the gap sits, the departments only
 * one store carries, and what both leave out of net sales.
 */

const dept = (name: string, gap = 0) => ({ name, gap }) as unknown as ReportRow;
const text = (el: HTMLElement) => el.textContent?.replace(/\s+/g, " ").trim();

describe("the department comparison's notes", () => {
  it("says how much of the behind pile the shown departments hold", () => {
    const { container } = render(
      <ConcentratedNote
        shown={[dept("Deli", -300), dept("Meat", -200)]}
        folded={[dept("Bakery", -50)]}
        underTotal={550}
      />,
    );
    expect(text(container)).toMatch(/departments hold \$500\.00 of the \$550\.00 behind · 1 other holds the rest\./);
  });

  it("names the departments only one store carries, by store", () => {
    const { container } = render(
      <NotComparedNote
        onlyMine={[dept("Floral")]}
        onlyTheirs={[dept("Fuel"), dept("Pharmacy")]}
        onlyMineTotal={120}
        onlyTheirsTotal={900}
        compareStoreName="TUPELO"
      />,
    );
    const t = text(container);
    expect(t).toMatch(/1 only here worth \$120\.00 · 2 only at TUPELO worth \$900\.00\./);
    expect(t).toMatch(/Only here: Floral/);
    expect(t).toMatch(/Only at TUPELO: Fuel, Pharmacy/);
  });

  it("says what both stores leave out of net sales", () => {
    const { container } = render(
      <HashNote
        hash={{ mine: 40, theirs: 1200, names: ["FUEL", "LOTTERY"] }}
        compareStoreName="TUPELO"
      />,
    );
    expect(text(container)).toBe(
      "Outside net sales at both stores, so not compared: $1,200.00 at TUPELO (FUEL, LOTTERY) · $40.00 here.",
    );
  });
});
