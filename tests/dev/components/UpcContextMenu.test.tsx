import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UpcContextMenu from "@/components-dev/UpcContextMenu";

const writeText = vi.fn();
beforeEach(() => {
  Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
});
afterEach(() => writeText.mockReset());

const menu = (shownUpcs?: string[]) =>
  render(
    <UpcContextMenu x={0} y={0} upc="111" allUpcs={["111", "222", "333"]} shownUpcs={shownUpcs} onClose={vi.fn()} />,
  );

describe("UpcContextMenu", () => {
  it("offers the shown UPCs, with their count, when a filter is narrowing the list", async () => {
    menu(["111", "333"]);
    const shown = screen.getByRole("button", { name: /Copy shown UPCs/ });
    expect(shown.textContent).toContain("2");
    await userEvent.click(shown);
    expect(writeText).toHaveBeenCalledWith("111, 333");
  });

  it("leaves the line out when nothing is narrowing the list", () => {
    menu();
    expect(screen.queryByRole("button", { name: /Copy shown UPCs/ })).toBeNull();
    expect(screen.getByRole("button", { name: /Copy all UPCs/ })).toBeTruthy();
  });
});
