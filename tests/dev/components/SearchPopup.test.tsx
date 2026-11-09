import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import SearchPopup from "@/components-dev/SearchPopup";

describe("SearchPopup", () => {
  it("shows the card it is given", () => {
    render(
      <SearchPopup onClose={() => {}}>
        <p>Search card</p>
      </SearchPopup>,
    );
    expect(screen.getByText("Search card")).toBeTruthy();
  });

  it("closes on a click outside the card, and not on one inside it", () => {
    const onClose = vi.fn();
    const { container } = render(
      <SearchPopup onClose={onClose}>
        <button>Load</button>
      </SearchPopup>,
    );
    fireEvent.click(screen.getByText("Load"));
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.click(container.firstChild as Element);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
