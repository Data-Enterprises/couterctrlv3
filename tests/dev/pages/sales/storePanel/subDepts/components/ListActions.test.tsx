import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ListActions from "@/pages/sales/dev/storePanel/subDepts/components/ListActions";

const actions = (over: Partial<Parameters<typeof ListActions>[0]> = {}) => {
  const props = {
    shownUpcs: ["111", "222"],
    pinned: null,
    canCompare: false,
    onPin: vi.fn(),
    onUnpin: vi.fn(),
    onCompare: vi.fn(),
    ...over,
  };
  render(<ListActions {...props} />);
  return props;
};

describe("ListActions", () => {
  it("copies the UPCs shown and says so", async () => {
    const writeText = vi.fn();
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    actions();
    const button = screen.getByRole("button", { name: "Copy 2 UPCs" });
    await userEvent.click(button);
    expect(writeText).toHaveBeenCalledWith("111, 222");
    expect(button.textContent).toBe("Copied");
  });

  it("can't copy an empty list", () => {
    actions({ shownUpcs: [] });
    expect((screen.getByRole("button", { name: "Copy 0 UPCs" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("pins the list as A with nothing pinned yet", async () => {
    const props = actions();
    await userEvent.click(screen.getByRole("button", { name: "Compare" }));
    expect(props.onPin).toHaveBeenCalledOnce();
  });

  it("shows A and opens the comparison once the filters make a second list", async () => {
    const props = actions({ pinned: { label: "Crit | pepsi", count: 7 }, canCompare: true });
    expect(screen.getByText("Crit | pepsi | 7 items")).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: "Compare with A" }));
    expect(props.onCompare).toHaveBeenCalledOnce();
    await userEvent.click(screen.getByRole("button", { name: "Drop list A" }));
    expect(props.onUnpin).toHaveBeenCalledOnce();
  });

  it("can't compare A with itself", () => {
    actions({ pinned: { label: "Crit | pepsi", count: 7 }, canCompare: false });
    expect((screen.getByRole("button", { name: "Compare with A" }) as HTMLButtonElement).disabled).toBe(true);
  });
});
