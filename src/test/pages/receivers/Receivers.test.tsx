import { describe, it, expect, vi, type Mock } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Receivers from "../../../pages/receivers/Receivers";
import { getReceiversList } from "../../../api/receivers";
import { setupStore } from "../../../store";
import { setToken } from "../../../features/appSlice";
import { userStores } from "../sales";
import { setAssignedStores } from "../../../features/userSlice";
import { renderWithProviders } from "../../utils";
import { receiverListResp } from ".";

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

  it("should handle opening the export modal", async () => {
    renderWithProviders(<Receivers />, { store });

    // (getReceiversList as Mock).mockResolvedValue(receiverListResp);
    // const exportBtn = await screen.findByTestId("receivers-export-btn");
    // await user.click(exportBtn);

    
  });
});
