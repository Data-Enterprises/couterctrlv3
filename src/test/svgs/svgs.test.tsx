import { describe, it, expect } from "vitest";
import { renderWithProviders } from "../utils";
import userEvent from "@testing-library/user-event";

import UpcListIcon from "../../svgs/UpcListIcon";
import SalesIconV2 from "../../svgs/SalesIconV2";

const user = userEvent.setup();

describe("SVG Components", () => {
  it("should render SalesIconV2 correctly", async () => {
    const { getByTestId } = renderWithProviders(
      <SalesIconV2 onClick={() => {}} />
    );
    const svgElement = getByTestId("sales-icon-v2");
    expect(svgElement).toBeInTheDocument();
    await user.click(svgElement);
  });

  it("should render UpcList Icon correctly", async () => {
    const { getByTestId } = renderWithProviders(
      <UpcListIcon onClick={() => {}} />
    );
    const svgElement = getByTestId("upc-list-icon");
    expect(svgElement).toBeInTheDocument();
    await user.click(svgElement);
  });
});
