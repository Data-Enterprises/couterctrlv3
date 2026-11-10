import { afterEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { usePanelSize } from "@/pages/sales/dev/storePanel/summary/hooks/usePanelSize";

let fire: () => void = () => {};
class FakeObserver {
  constructor(cb: () => void) {
    fire = cb;
  }
  observe() {}
  disconnect() {}
}

const Probe = () => {
  const { ref, narrow, short } = usePanelSize(860, 600);
  return (
    <div ref={ref}>
      {narrow ? "narrow" : "wide"} {short ? "short" : "tall"}
    </div>
  );
};

const sizeIs = (width: number, height: number) =>
  vi
    .spyOn(HTMLElement.prototype, "getBoundingClientRect")
    .mockReturnValue({ width, height } as DOMRect);

describe("the panel's own size", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("stays full size where it cannot measure", () => {
    vi.stubGlobal("ResizeObserver", undefined);
    render(<Probe />);
    expect(screen.getByText("wide tall")).toBeTruthy();
  });

  it("does not read a panel that is not laid out yet as a tiny one", () => {
    vi.stubGlobal("ResizeObserver", FakeObserver);
    sizeIs(0, 0);
    render(<Probe />);
    expect(screen.getByText("wide tall")).toBeTruthy();
  });

  it("follows the panel as it resizes, in both directions", () => {
    vi.stubGlobal("ResizeObserver", FakeObserver);
    const spy = sizeIs(760, 540);
    render(<Probe />);
    expect(screen.getByText("narrow short")).toBeTruthy();
    spy.mockReturnValue({ width: 1120, height: 720 } as DOMRect);
    act(() => fire());
    expect(screen.getByText("wide tall")).toBeTruthy();
  });
});
