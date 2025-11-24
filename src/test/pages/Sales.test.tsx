import { describe, it, expect } from "vitest";
import { renderWithProviders } from "../utils";
import { screen } from "@testing-library/react";
import Sales from "../../pages/sales/Sales";
// import userEvent from "@testing-library/user-event";

// const user = userEvent.setup();

describe("Sales Page", () => {
  it("should render with main components", () => {
    renderWithProviders(<Sales />);
    const sales = screen.getByTestId("sales-page");
    expect(sales).toBeInTheDocument();
    // const topTen = screen.getByTestId("sales-top-ten");
    // expect(topTen).toBeInTheDocument();
    // const deptSales = screen.getByTestId("dept-sales");
    // expect(deptSales).toBeInTheDocument();
    // const weeklyNetSales = screen.getByTestId("weekly-net-sales");
    // expect(weeklyNetSales).toBeInTheDocument();
  });
});
