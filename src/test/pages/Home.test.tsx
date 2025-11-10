import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../utils";
import Home from "../../pages/home/Home";

describe("Home Page", () => {
  it("should render", () => {
    renderWithProviders(<Home />);
    const homePage = screen.getByTestId("home-page");
    expect(homePage).toBeInTheDocument();
  });
});
