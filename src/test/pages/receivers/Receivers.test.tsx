import { describe, it, expect, vi, type Mock } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Receivers from "../../../pages/receivers/Receivers";
import { getReceiversList, getReceiverDetails } from "../../../api/receivers";
import { setupStore } from "../../../store";
import { setToken } from "../../../features/appSlice";
import { userStores } from "../sales";
import { setAssignedStores } from "../../../features/userSlice";
import { renderWithProviders } from "../../utils";
import { receiverListResp, detailsResp } from ".";

const user = userEvent.setup();
const store = setupStore();
store.dispatch(setToken("fake-token"));
store.dispatch(setAssignedStores(userStores.assigned_stores));

vi.mock("../../../api/receivers");

const mockedToastError = vi.fn();
const mockedToastWarn = vi.fn();
vi.mock("../../../components/toasts/hooks/useToast", () => ({
  useToast: () => ({
    error: mockedToastError,
    warn: mockedToastWarn,
  }),
}));

describe("Receivers Page", () => {
  it("should throw warning when fetching receiver list without a store id", async () => {
    renderWithProviders(<Receivers />, { store });

    const searchBtn = await screen.findByTestId("date-picker-search-btn");
    await user.click(searchBtn);

    await waitFor(() => {
      expect(mockedToastWarn).toHaveBeenCalledWith("Please select a store");
    });
  });

  it("should throw api error when fetching receiver list", async () => {
    (getReceiversList as Mock).mockRejectedValueOnce(new Error("API Error"));
    renderWithProviders(<Receivers />, { store });

    const trigger = await screen.findByTestId("single-select-trigger-icon-0");
    await user.click(trigger);

    const option = await screen.findByTestId("single-select-option-0-0");
    await user.click(option);

    const searchBtn = await screen.findByTestId("date-picker-search-btn");
    await user.click(searchBtn);

    await waitFor(() => {
      expect(mockedToastError).toHaveBeenCalledWith("API Error");
    });
  });

  it("should handle api success when fetching receiver list", async () => {
    (getReceiversList as Mock).mockResolvedValue(receiverListResp);
    renderWithProviders(<Receivers />, { store });

    const trigger = await screen.findByTestId("single-select-trigger-icon-0");
    await user.click(trigger);

    const option = await screen.findByTestId("single-select-option-0-0");
    await user.click(option);

    const searchBtn = await screen.findByTestId("date-picker-search-btn");
    await user.click(searchBtn);

    await waitFor(() => {
      const state = store.getState().receivers;
      expect(state.list.length).toEqual(receiverListResp.data.recievers.length);
    });
  });

  it("should throw error on API failure when fetching receiver details", async () => {
    (getReceiverDetails as Mock).mockRejectedValueOnce(new Error("API Error"));
    renderWithProviders(<Receivers />, { store });

    const rows = await screen.findAllByRole("row");
    await user.click(rows[1]);

    await waitFor(() => {
      expect(mockedToastError).toHaveBeenCalledWith("API Error");
    });
  });

  it("should fetch receiver details when a receiver is selected", async () => {
    (getReceiverDetails as Mock).mockResolvedValue(detailsResp);
    renderWithProviders(<Receivers />, { store });

    const rows = await screen.findAllByRole("row");
    await user.click(rows[1]);
  });

  it("should handle exportmodal interactions", async () => {
    renderWithProviders(<Receivers />, { store });
    const exportBtn = await screen.findByTestId("receivers-export-btn");
    await user.click(exportBtn);

    await waitFor(() => {
      const exportModal = screen.getByTestId("modal");
      expect(exportModal).toBeInTheDocument();
    });

    const input = await screen.findByTestId("receivers-filename-input");
    const submitBtn = await screen.findByTestId("receivers-data-export");

    // get the toast warning
    await user.click(submitBtn);

    await waitFor(() => {
      expect(mockedToastWarn).toHaveBeenCalledWith(
        "Please enter a valid file name."
      );
    });

    await user.type(input, "test-file");
    await user.click(submitBtn);
  });

  // Refresh the whole page and test the Receivers List grid filters
  it("should Refresh the whole page if clicking the top Refresh button", async () => {
    renderWithProviders(<Receivers />, { store });
    const refreshBtn = await screen.findByTestId("rec-page-refresh-btn");
    await user.click(refreshBtn);

    await waitFor(() => {
      const state = store.getState().receivers;
      expect(state.list.length).toEqual(0);
      expect(state.details.length).toEqual(0);
    });
  });

  it("should allow the user to refetch data after page refresh", async () => {
    (getReceiversList as Mock).mockResolvedValue(receiverListResp);
    renderWithProviders(<Receivers />, { store });

    const trigger = await screen.findByTestId("single-select-trigger-icon-0");
    await user.click(trigger);

    const option = await screen.findByTestId("single-select-option-0-0");
    await user.click(option);

    const searchBtn = await screen.findByTestId("date-picker-search-btn");
    await user.click(searchBtn);

    await waitFor(() => {
      const state = store.getState().receivers;
      expect(state.list.length).toEqual(receiverListResp.data.recievers.length);
    });
  });

  it("should handle setting the Vendor ID filter", async () => {});

  it("should handle the Vendor Name filter", async () => {});

  it("should handle the Transaction ID filter", async () => {});

  it("should handle the Invoice ID filter", async () => {});

  it("should handle refreshing the Receiver List grid filters", async () => {});
});
