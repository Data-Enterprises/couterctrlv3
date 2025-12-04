import { describe, it, expect } from "vitest";
import { renderWithProviders } from "../../utils";
import { screen } from "@testing-library/react";
import UpcList from "../../../pages/upc/wizard/UpcList";
// import userEvent from "@testing-library/user-event";

// Starting here tomorrow until Tommy or Mike hit you up
// const user = userEvent.setup();

describe("UpcList Page", () => {
  it("should render UpcList page correctly", async () => {
    renderWithProviders(<UpcList />);
    const page = screen.getByTestId("upc-list-page");
    expect(page).toBeInTheDocument();
  });
});
