import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../utils";
import Cashiers from "../../pages/cashiers/Cashiers";

describe("Cashiers Page", () => {
  it("should render", () => {
    renderWithProviders(<Cashiers />);
    const cashiersPage = screen.getByTestId("cashiers-page");
    expect(cashiersPage).toBeInTheDocument();
  });
});
