import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import GridCellContent from "@/pages/sales/dev/investigate/items/grid/components/GridCellContent";
import { COLUMNS } from "@/pages/sales/dev/investigate/utils/columns";
import type { ItemVerdict } from "@/pages/sales/dev/investigate/interfaces";

/*
 * The grid's cells are described by the column table and drawn here: a figure,
 * a signed pill that says which way it went, or the cause chip.
 */

const money = (v: number) => "$" + v.toFixed(2);
const column = (key: string) => COLUMNS.find((c) => c.key === key)!;
const item = {
  description: "GROUND BEEF",
  productCode: "0001",
  vendorName: "",
  gap: -12.5,
  orderedQty: 0,
  margins: { diff: 0, costPenalty: null, minePerUnit: null, theirsPerUnit: null },
} as unknown as ItemVerdict;

describe("GridCellContent", () => {
  it("draws a gap as a signed pill in the direction it went", () => {
    render(<GridCellContent cell={column("gap").render(item, money)} />);
    const pill = screen.getByText((_, el) => el?.textContent === "−$12.50" && el.tagName === "SPAN");
    expect(pill.className).toContain("bg-delta_negative_bg");
  });

  it("draws a gap of nothing as a plain, muted pill", () => {
    render(<GridCellContent cell={column("marginDiff").render(item, money)} />);
    const pill = screen.getByText((_, el) => el?.textContent === "+$0.00" && el.tagName === "SPAN");
    expect(pill.className).toContain("bg-fill_muted");
  });

  it("says none, muted, for an item never ordered, and a dash for no vendor", () => {
    render(
      <>
        <GridCellContent cell={column("ordered").render(item, money)} />
        <GridCellContent cell={column("vendor").render(item, money)} />
      </>,
    );
    expect(screen.getByText("none").className).toBe("text-content/95");
    expect(screen.getByText("—").className).toBe("text-content/95");
  });

  it("totals the items in caps under the item column", () => {
    render(<GridCellContent cell={column("item").foot!([item, item], money)} />);
    expect(screen.getByText("Totals · 2 items").className).toBe("uppercase tracking-wide");
  });
});
