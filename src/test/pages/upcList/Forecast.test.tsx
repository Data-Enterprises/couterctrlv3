import { describe, expect, it, vi, type Mock } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { setupStore } from "../../../store";
import { renderWithProviders } from "../../utils";
import userEvent from "@testing-library/user-event";

// Dispatchers
import { setAssignedStores } from "../../../features/userSlice";

// API calls to be mocked
import { getForecasting } from "../../../api/upc";

// Responses
import { stores, forecastResp, JsonErrorResp, groups } from ".";
import { groupStoresResp } from "../forecast";

// Components being tested
import UpcList from "../../../pages/upc/UpcList";
import { getStoresAssignedToUserGroup } from "../../../api/groups";
import { setGroups } from "../../../features/groupSlice";

vi.mock("../../../api/groups");
vi.mock("../../../api/upc");
const store = setupStore();
store.dispatch(setAssignedStores(stores));
store.dispatch(setGroups(groups));

const user = userEvent.setup();
const mockedToastWarn = vi.fn();
const mockedToastError = vi.fn();
vi.mock("../../../components/toasts/hooks/useToast", () => ({
  useToast: () => ({
    warn: mockedToastWarn,
    error: mockedToastError,
  }),
}));

vi.mock("@nivo/line", () => ({
  ResponsiveLine: vi.fn((props) => {
    if (props.axisLeft?.format) {
      props.axisLeft.format("5.99"); // singleRow case
      props.axisLeft.format("3"); // multiRow case
    }

    if (props.colors) props.colors({ id: "test", value: 100 });
    return <div data-testid="responsive-line" />;
  }),
}));

describe("PriceOpt Module in UpcList", () => {
  it("should handle API failure when fetching stores for a group", async () => {
    (getForecasting as Mock).mockRejectedValue({
      data: JsonErrorResp,
    });

    (getStoresAssignedToUserGroup as Mock).mockRejectedValue(groupStoresResp);
    renderWithProviders(<UpcList />, { store });

    const groupDropdown = await screen.findByTestId(
      "single-select-trigger-icon-1",
    );
    await user.click(groupDropdown);
    const groupOption = await screen.findByTestId("single-select-option-1-1");
    await user.click(groupOption);

    const dropdown = await screen.findByTestId("single-select-trigger-icon-2");

    await user.click(dropdown);
    const option = await screen.findByTestId("single-select-option-2-1");
    await user.click(option);

    await waitFor(() => {
      expect(mockedToastError).toHaveBeenCalled();
    });
  });

  it("should handle API failure when fetching forecast data", async () => {
    // Mock the API failure
    (getForecasting as Mock).mockRejectedValue({
      data: JsonErrorResp,
    });

    (getStoresAssignedToUserGroup as Mock).mockResolvedValue(groupStoresResp);
    renderWithProviders(<UpcList />, { store });

    const groupDropdown = await screen.findByTestId(
      "single-select-trigger-icon-1",
    );
    await user.click(groupDropdown);
    const groupOption = await screen.findByTestId("single-select-option-1-1");
    await user.click(groupOption);

    const dropdown = await screen.findByTestId("single-select-trigger-icon-2");

    await user.click(dropdown);
    const option = await screen.findByTestId("single-select-option-2-1");
    await user.click(option);

    const forecast = await screen.findByTestId("radio-2");
    await user.click(forecast);

    const searchBtn = await screen.findByTestId("upc-module-data-search-btn");
    await user.click(searchBtn);

    await waitFor(() => {
      expect(mockedToastError).toHaveBeenCalled();
    });
  });

  it("should handle throw a warning if no records are returned", async () => {
    // Mock the API failure
    (getForecasting as Mock).mockResolvedValue({
      data: { error: 0, qty_results: null },
    });

    renderWithProviders(<UpcList />, { store });

    const dropdown = await screen.findByTestId("single-select-trigger-icon-2");

    await user.click(dropdown);
    const option = await screen.findByTestId("single-select-option-2-1");
    await user.click(option);

    const salesComp = await screen.findByTestId("radio-2");
    await user.click(salesComp);

    const searchBtn = await screen.findByTestId("upc-module-data-search-btn");
    await user.click(searchBtn);

    await waitFor(() => {
      expect(mockedToastWarn).toHaveBeenCalledWith("No Records Found");
    });
  });

  it("should handle API success when fetching Forecast data", async () => {
    // Mock the API failure
    (getForecasting as Mock).mockResolvedValue(forecastResp);

    renderWithProviders(<UpcList />, { store });

    const dropdown = await screen.findByTestId("single-select-trigger-icon-2");

    await user.click(dropdown);
    const option = await screen.findByTestId("single-select-option-2-1");
    await user.click(option);

    const salesComp = await screen.findByTestId("radio-2");
    await user.click(salesComp);

    const searchBtn = await screen.findByTestId("upc-module-data-search-btn");
    await user.click(searchBtn);
  });

  it("should handle info icon hover in MetricCard", async () => {
    renderWithProviders(<UpcList />, { store });

    const overallQtyInfoIcon = await screen.findByTestId(
      "info-icon-quantity-overall"
    );
    await user.hover(overallQtyInfoIcon);
    await user.unhover(overallQtyInfoIcon);
  });

  it("should populate forecast line componenet when selecing a upc", async () => {
    renderWithProviders(<UpcList />, { store });

    const upcOne = await screen.findByTestId("check-0");
    await user.click(upcOne);
    // await user.click(upcOne);

    const selectedItem = await screen.findByTestId("forecast-legend-item-0");
    expect(selectedItem).toBeInTheDocument();

    await user.click(selectedItem);
  });

  // Test the exporting of the data in UpcModal
  it("should throw warning for missing file name in export modal", async () => {
    renderWithProviders(<UpcList />, { store });
    const exportBtn = await screen.findByTestId("upc-controls-export-btn");
    await user.click(exportBtn);

    const modal = await screen.findByTestId("modal");
    expect(modal).toBeInTheDocument();

    const submit = await screen.findByTestId("upc-export-modal-submit-btn");
    await user.click(submit);

    await waitFor(() => {
      expect(mockedToastWarn).toHaveBeenCalledWith("Please enter a file name");
    });
  });

  it("should handle exporting forecast dates data", async () => {
    renderWithProviders(<UpcList />, { store });
    const exportBtn = await screen.findByTestId("upc-controls-export-btn");
    await user.click(exportBtn);

    const modal = await screen.findByTestId("modal");
    expect(modal).toBeInTheDocument();

    //file name
    const fileNameInput = await screen.findByTestId("text-input-csvFileName");
    await user.type(fileNameInput, "forecast_export");

    // Testing the clicking of the radio options
    const datesRadio = await screen.findByTestId("check-0-forecast-dates");
    const metricsRadio = await screen.findByTestId("check-1-forecast-metrics");

    await user.click(metricsRadio);
    await user.click(datesRadio);

    // submit the valid export request
    const submit = await screen.findByTestId("upc-export-modal-submit-btn");
    await user.click(submit);

    await waitFor(() => {
      expect(modal).not.toBeInTheDocument();
    });
  });

  it("should handle exporting forecast metrics data", async () => {
    renderWithProviders(<UpcList />, { store });
    const exportBtn = await screen.findByTestId("upc-controls-export-btn");
    await user.click(exportBtn);

    const modal = await screen.findByTestId("modal");
    expect(modal).toBeInTheDocument();

    //file name and metrics radio
    const metricsRadio = await screen.findByTestId("check-1-forecast-metrics");
    const fileNameInput = await screen.findByTestId("text-input-csvFileName");
    await user.type(fileNameInput, "forecast_export");
    await user.click(metricsRadio);

    // submit the valid export request
    const submit = await screen.findByTestId("upc-export-modal-submit-btn");
    await user.click(submit);

    await waitFor(() => {
      expect(modal).not.toBeInTheDocument();
    });
  });
});
