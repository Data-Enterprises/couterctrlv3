import { describe, it, expect, vi } from "vitest";
import { renderWithProviders } from "../utils";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DatePickers from "../../components/datePickers/DatePickers";
import { setupStore } from "../../store";

const startStore = setupStore();
const endStore = setupStore();
const warnStore = setupStore();
const user = userEvent.setup();

const mockedToastWarn = vi.fn();
vi.mock("../../components/toasts/hooks/useToast", () => ({
  useToast: () => ({
    warn: mockedToastWarn,
  }),
}));

describe("DatePickers Component", () => {
  it("should display the calendar when clicking on the start date picker", async () => {
    renderWithProviders(<DatePickers />, { store: startStore });
    const startDatePicker = screen.getByTestId("start-date-picker");
    await waitFor(() => {
      expect(startDatePicker).toBeInTheDocument();
    });

    // Find the menu button and click it
    const startDateMenuButton = screen.getByTestId("start-date-menu-button");
    expect(startDateMenuButton).toBeInTheDocument();
    await user.click(startDateMenuButton);

    // The headless ui component renders the menu items in a portal, so we need to wait for it
    const calendar = await screen.findByTestId("calendar-container");
    expect(calendar).toBeInTheDocument();

    // Select invalid start date (after today)
    const dayToClick = await screen.findByTestId("start-calendar-day-0");
    await user.click(dayToClick);

    await user.click(startDateMenuButton);

    // Then select a valid start date
    const prevMonthBtn = await screen.findByTestId("prev-month-button");
    expect(prevMonthBtn).toBeInTheDocument();
    await user.click(prevMonthBtn);

    const newDayToClick = await screen.findByTestId("start-calendar-day-1");

    expect(newDayToClick).toBeInTheDocument();
    await user.click(newDayToClick);

    await user.click(startDateMenuButton);

    const nextMonthBtn = await screen.findByTestId("next-month-button");
    expect(nextMonthBtn).toBeInTheDocument();
    await user.click(nextMonthBtn);
  });

  it("should display the calendar when clicking on the end date picker", async () => {
    renderWithProviders(<DatePickers />, { store: endStore });
    const endDatePicker = screen.getByTestId("end-date-picker");
    expect(endDatePicker).toBeInTheDocument();

    // Find the menu button and click it
    const endDateMenuButton = screen.getByTestId("end-date-menu-button");
    expect(endDateMenuButton).toBeInTheDocument();
    await user.click(endDateMenuButton);

    // The headless ui component renders the menu items in a portal, so we need to wait for it
    const calendar = await screen.findByTestId("end-calendar-container");
    expect(calendar).toBeInTheDocument();

    const prevMonthBtn = await screen.findByTestId("prev-month-button");
    await user.click(prevMonthBtn);
    await user.click(prevMonthBtn);

    const dayToClick = await screen.findByTestId("end-calendar-day-11");
    await user.click(dayToClick);

    await waitFor(() => {
      expect(mockedToastWarn).toHaveBeenCalledWith(
        "End date cannot be before the start date"
      );
    });

    const nextMonthBtn = await screen.findByTestId("next-month-button");
    expect(nextMonthBtn).toBeInTheDocument();
    await user.click(nextMonthBtn);
    await user.click(nextMonthBtn);
    await user.click(dayToClick);
  });

  it("should handle Search button click", async () => {
    const handleQuery = vi.fn();
    renderWithProviders(<DatePickers handleQuery={handleQuery} />, {
      store: setupStore(),
    });
    const searchBtn = screen.getByTestId("date-picker-search-btn");
    expect(searchBtn).toBeInTheDocument();
    await user.click(searchBtn);
    expect(handleQuery).toHaveBeenCalled();
  });

  it("should throw a warning when selecting an invalid start date", async () => {
    renderWithProviders(<DatePickers />, { store: warnStore });

    const startDateMenuButton = screen.getByTestId("start-date-menu-button");
    await user.click(startDateMenuButton);

    // Go to prev month and select the first day of the month
    const startDatePrevMonth = await screen.findByTestId("prev-month-button");
    await user.click(startDatePrevMonth);

    const validStartDate = await screen.findByTestId("start-calendar-day-1");
    await user.click(validStartDate);

    // Set this after the start date
    const endDateMenuButton = screen.getByTestId("end-date-menu-button");
    await user.click(endDateMenuButton);
    const endDatePrevMonth = await screen.findByTestId("prev-month-button")
    await user.click(endDatePrevMonth);

    const validEndDate = await screen.findByTestId("end-calendar-day-4");
    await user.click(validEndDate);

    await waitFor(() => {
      const state = warnStore.getState().search;
      console.log(state)
    });

    // then select a start date that is after the end date
    await user.click(startDateMenuButton);
    await user.click(startDatePrevMonth);
    
    const invalidStartDate = await screen.findByTestId("start-calendar-day-5");
    await user.click(invalidStartDate);

    await waitFor(() => {
      expect(mockedToastWarn).toHaveBeenCalledWith(
        "Start date cannot be after the end date"
      );
    });
  });

  it("should handle displaying previous year", async () => {
    renderWithProviders(<DatePickers />, { store: setupStore() });
    const startDatePicker = screen.getByTestId("start-date-picker");
    expect(startDatePicker).toBeInTheDocument();

    const startDateMenuButton = screen.getByTestId("start-date-menu-button");
    await user.click(startDateMenuButton);
    const prevMonth = await screen.findByTestId("prev-month-button");

    for (let i = 0; i < 12; i++) {
      await user.click(prevMonth);
    }
  });

  it("should handle displaying next year", async () => {
    renderWithProviders(<DatePickers />, { store: setupStore() });
    const startDatePicker = screen.getByTestId("start-date-picker");
    expect(startDatePicker).toBeInTheDocument();

    const startDateMenuButton = screen.getByTestId("start-date-menu-button");
    await user.click(startDateMenuButton);
    const nextMonth = await screen.findByTestId("next-month-button");

    for (let i = 0; i < 12; i++) {
      await user.click(nextMonth);
    }
  });
});
