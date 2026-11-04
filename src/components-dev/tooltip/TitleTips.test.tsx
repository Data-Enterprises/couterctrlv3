import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import TitleTips from "./TitleTips";

const page = () =>
  render(
    <div>
      <TitleTips />
      <button type="button" title="Export CSV">
        <svg data-testid="icon" aria-hidden="true" width="10" height="10" />
      </button>
      <span title={"Two\nlines"}>note</span>
      <p>plain</p>
    </div>,
  );

describe("title tooltips as the app's tip", () => {
  it("draws a hovered title as a CursorTip, with the browser's box held off meanwhile", () => {
    page();
    const button = screen.getByRole("button");
    fireEvent.mouseMove(screen.getByTestId("icon"), { clientX: 30, clientY: 20 });
    expect(screen.getByRole("tooltip").textContent).toBe("Export CSV");
    expect(button.getAttribute("title")).toBeNull();
  });

  it("puts the title back and clears the tip on leaving", () => {
    page();
    const button = screen.getByRole("button");
    fireEvent.mouseMove(button, { clientX: 30, clientY: 20 });
    fireEvent.mouseMove(screen.getByText("plain"), { clientX: 30, clientY: 90 });
    expect(screen.queryByRole("tooltip")).toBeNull();
    expect(button.getAttribute("title")).toBe("Export CSV");
  });

  it("splits a title's line breaks into lines", () => {
    page();
    fireEvent.mouseMove(screen.getByText("note"), { clientX: 30, clientY: 50 });
    expect(screen.getByRole("tooltip").children).toHaveLength(2);
  });

  it("hides on a press until the pointer leaves", () => {
    page();
    const button = screen.getByRole("button");
    fireEvent.mouseMove(button, { clientX: 30, clientY: 20 });
    fireEvent.mouseDown(button);
    fireEvent.mouseMove(button, { clientX: 32, clientY: 20 });
    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("keeps the title as the button's accessible name when not hovered", () => {
    page();
    expect(screen.getByRole("button", { name: "Export CSV" })).toBeTruthy();
  });
});
