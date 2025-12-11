import { describe, it, expect } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "../utils";
import SingleDatePicker from "../../components/datePickers/SingleDatePicker";
import userEvent from "@testing-library/user-event";
import { setupStore } from "../../store";
import { setIsDesktop, setIsMobile } from "../../features/appSlice";

const user = userEvent.setup();
const store = setupStore();
store.dispatch(setIsDesktop(false));
store.dispatch(setIsMobile(true));

describe("SingleDatePicker component", async () => {
  it("should render with mobile styling", async () => {
    renderWithProviders(<SingleDatePicker />, { store });
    const datePicker = await screen.findByTestId("single-date-picker");
    expect(datePicker).toHaveClass(
      "relative inline-block text-left md:px-0 mx-auto w-full"
    );

    // reset back to desktop
    await waitFor(() => {
      store.dispatch(setIsDesktop(true));
      store.dispatch(setIsMobile(false));
    });
  });
  it("should render with desktop styling", async () => {
    renderWithProviders(<SingleDatePicker />, { store });
    const datePicker = await screen.findByTestId("single-date-picker");
    expect(datePicker).toHaveClass("relative text-left md:px-0 w-full");
  });

  it("should handle selecint a single date", async () => {
    renderWithProviders(<SingleDatePicker />, { store });
    const menuBtn = await screen.findByTestId("single-date-menu-button");
    await user.click(menuBtn);

    // Just select a date to update the search slice
    const dateToClick = await screen.findByTestId("single-calendar-day-10");
    await user.click(dateToClick);
  });
});
