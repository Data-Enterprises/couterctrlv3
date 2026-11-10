import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BackButton from "@/components-dev/BackButton";

describe("BackButton", () => {
  it("says Back in words, and is named for where it goes", async () => {
    const onClick = vi.fn();
    render(<BackButton onClick={onClick} helpAnchor="search" />);
    const button = screen.getByRole("button", { name: "Back to the search" });
    expect(button.textContent).toBe("Back");
    expect(button.getAttribute("data-help")).toBe("search");
    await userEvent.click(button);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("takes a different name for a step back up a drill", () => {
    render(<BackButton onClick={vi.fn()} title="Back" tone="light" />);
    expect(screen.getByRole("button", { name: "Back" })).toBeTruthy();
  });
});
