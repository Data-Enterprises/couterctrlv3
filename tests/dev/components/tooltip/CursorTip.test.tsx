import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import CursorTip from "@/components-dev/tooltip/CursorTip";
import { useCursorTip } from "@/components-dev/tooltip/useCursorTip";

const Target = () => {
  const { tip, track, clear } = useCursorTip<true>();
  return (
    <>
      <button type="button" aria-label="Export CSV" onMouseMove={track(true)} onMouseLeave={clear} />
      {tip && <CursorTip lines={["Export CSV"]} x={tip.x} y={tip.y} />}
    </>
  );
};

describe("the app's tooltip", () => {
  it("appears beside the pointer while it is over the target, and goes when it leaves", () => {
    render(<Target />);
    const button = screen.getByRole("button", { name: "Export CSV" });
    expect(screen.queryByRole("tooltip")).toBeNull();
    fireEvent.mouseMove(button, { clientX: 40, clientY: 30 });
    const tip = screen.getByRole("tooltip");
    expect(tip.textContent).toBe("Export CSV");
    expect(tip.style.left).toBe("54px");
    fireEvent.mouseLeave(button);
    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("is not the browser's title box", () => {
    render(<Target />);
    expect(screen.getByRole("button").getAttribute("title")).toBeNull();
  });
});
