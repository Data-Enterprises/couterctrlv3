import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ListActions from "@/pages/sales/dev/storePanel/subDepts/components/ListActions";

describe("ListActions", () => {
  it("copies the UPCs shown and says so", async () => {
    const writeText = vi.fn();
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    render(<ListActions shownUpcs={["111", "222"]} />);
    const button = screen.getByRole("button", { name: "Copy 2 UPCs" });
    await userEvent.click(button);
    expect(writeText).toHaveBeenCalledWith("111, 222");
    expect(button.textContent).toBe("Copied");
  });

  it("can't copy an empty list", () => {
    render(<ListActions shownUpcs={[]} />);
    expect((screen.getByRole("button", { name: "Copy 0 UPCs" }) as HTMLButtonElement).disabled).toBe(true);
  });
});
