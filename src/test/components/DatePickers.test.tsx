import DatePickers from "../../components/datePickers/DatePickers";
import { renderWithProviders } from "../utils";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";

describe("DatePickers Component", () => {
  const user = userEvent.setup();

  it("should render component with the start and end date pickers", () => {
    renderWithProviders(<DatePickers />);
    const datePickers = screen.getByTestId("date-pickers");
    const startDatePicker = screen.getByTestId("start-date-picker");
    const endDatePicker = screen.getByTestId("end-date-picker");
    expect(datePickers).toBeInTheDocument();
    expect(startDatePicker).toBeInTheDocument();
    expect(endDatePicker).toBeInTheDocument();
  });

  it("should display the calendar when clicking on the start date picker", async () => {
    renderWithProviders(<DatePickers />);
    const startDatePicker = screen.getByTestId("start-date-picker");
    expect(startDatePicker).toBeInTheDocument();

    // Find the menu button and click it
    const startDateMenuButton = screen.getByTestId("start-date-menu-button");
    expect(startDateMenuButton).toBeInTheDocument();
    await user.click(startDateMenuButton);

    // The headless ui component renders the menu items in a portal, so we need to wait for it
    const calendar = await screen.findByTestId("calendar-container");
    expect(calendar).toBeInTheDocument();
  });

    it("should display the calendar when clicking on the end date picker", async () => {
      renderWithProviders(<DatePickers />);
      const endDatePicker = screen.getByTestId("end-date-picker");
      expect(endDatePicker).toBeInTheDocument();

      // Find the menu button and click it
      const endDateMenuButton = screen.getByTestId("end-date-menu-button");
      expect(endDateMenuButton).toBeInTheDocument();
      await user.click(endDateMenuButton);

      // The headless ui component renders the menu items in a portal, so we need to wait for it
      const calendar = await screen.findByTestId("end-calendar-container");
      expect(calendar).toBeInTheDocument();
    });
});
