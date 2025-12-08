import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../utils";
import userEvent from "@testing-library/user-event";
import Forecast from "../../../pages/forecast/Forecast";
import { screen, waitFor } from "@testing-library/react";

const user = userEvent.setup();
const mockToastWarn = vi.fn();
vi.mock("../../../components/toasts/hooks/useToast", () => {
  return {
    useToast: () => ({
      warn: mockToastWarn,
    }),
  };
});

describe("Forecast Page", () => {
  it("should render without crashing", async () => {
    renderWithProviders(<Forecast />);
    const page = await screen.findByTestId("forecast-page");
    expect(page).toBeInTheDocument();
  });

  it("should show warning toast for invalid file type", async () => {
    renderWithProviders(<Forecast />);
    const incorrecFile = new File(["dummy content"], "forecast.txt", {
      type: "text/plain",
    });
    const input = screen.getByTestId("upc-file-input") as HTMLInputElement;
    await user.upload(input, incorrecFile);

    await waitFor(() => {
      expect(mockToastWarn).toHaveBeenCalledWith("Please select a valid CSV file");
    });
  });

  it("should handle successful .csv file upload from user", async () => {
    renderWithProviders(<Forecast />);
    const file = new File(
      ["store,date,forecast\n001,2024-01-01,100"],
      "forecast.csv",
      {
        type: "text/csv",
      }
    );
    const input = screen.getByTestId("upc-file-input") as HTMLInputElement;
    await user.upload(input, file);
    expect(input.files).toHaveLength(1);
    expect(input.files?.[0]).toStrictEqual(file);
  });
});
