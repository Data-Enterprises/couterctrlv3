import DatePickers from "../../components/datePickers/DatePickers";
import { renderWithProviders } from "../utils";
import { mockStore as store } from "../mockStore";
import { screen, waitFor } from "@testing-library/react";
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

  // it("should display the calendar when clicking on the start date picker", async () => {
  //   renderWithProviders(<DatePickers />);
  //   const startDatePicker = screen.getByTestId("start-date-picker");
  //   await user.click(startDatePicker);
  //   // const calendar = screen.getByTestId("calendar-container");

  //   // console.log(calendar);

  //   // await waitFor(() => {
  //   //   expect(calendar).toBeInTheDocument();
  //   // });
  // });
});
