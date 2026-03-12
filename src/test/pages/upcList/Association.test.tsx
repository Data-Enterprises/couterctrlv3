import { describe, expect, it, vi, type Mock } from "vitest";
import { screen, waitFor, fireEvent } from "@testing-library/react";
import { setupStore } from "../../../store";
import { renderWithProviders } from "../../utils";
import userEvent from "@testing-library/user-event";

// Dispatchers
import { setAssignedStores } from "../../../features/userSlice";

// API calls to be mocked
import { getItemAssociation } from "../../../api/upc";

// Responses
import {
  stores,
  selectAllRespOne,
  JsonErrorResp,
  lvlOneResp,
  lvlOneMultiResp,
  lvl2Resp,
  lvl2MultiResp,
  singleUpcAssociationResp,
} from ".";

// Components being tested
import UpcList from "../../../pages/upc/UpcList";

vi.mock("../../../api/upc");
const store = setupStore();
store.dispatch(setAssignedStores(stores));

const user = userEvent.setup();
const mockedToastWarn = vi.fn();
const mockedToastError = vi.fn();
vi.mock("../../../components/toasts/hooks/useToast", () => ({
  useToast: () => ({
    warn: mockedToastWarn,
    error: mockedToastError,
  }),
}));

const contents = [
  "1200000017",
  "1200000088",
  "1200000170",
  "1200001879",
  "1200003068",
  "1200017077",
  "3710003613",
  "3710004213",
  "7800008316",
  "7800008216",
  "2412600908",
  "1200081009",
  "2412601022",
  "3410057243",
  "3410057306",
].join("\n");

const file = new File(["upc\n" + contents], "forecast.csv", {
  type: "text/csv",
});

describe.skip("UpcList - Item Associations", () => {
  it("should render UpcControls when Search is clicked", async () => {
    renderWithProviders(<UpcList />, { store });

    const dropdown = await screen.findByTestId("single-select-trigger-icon-2");

    await user.click(dropdown);
    const option = await screen.findByTestId("single-select-option-2-1");
    await user.click(option);

    const salesComp = await screen.findByTestId("radio-5");
    await user.click(salesComp);

    const fileInput = (await screen.findByTestId(
      "upc-file-input",
    )) as HTMLInputElement;
    await user.upload(fileInput, file);

    const searchBtn = await screen.findByTestId("upc-module-data-search-btn");
    await user.click(searchBtn);
  });

  it("should handle API failure when fetching item associations", async () => {
    (getItemAssociation as Mock).mockRejectedValueOnce(JsonErrorResp);
    renderWithProviders(<UpcList />, { store });

    const selectAll = await screen.findByTestId("upc-select-all-btn");
    await user.click(selectAll);

    await waitFor(() => {
      expect(mockedToastError).toHaveBeenCalled();
    });
  });

  it("should handle no items coming back", async () => {
    (getItemAssociation as Mock).mockResolvedValue({
      data: { error: 1, items: [] },
    });
    renderWithProviders(<UpcList />, { store });

    const selectAll = await screen.findByTestId("upc-select-all-btn");
    await user.click(selectAll);

    // Expect no data display or something/maybe a toast message
  });

  it("should handle deselecting all upcs from UpcControls", async () => {
    (getItemAssociation as Mock).mockResolvedValue(selectAllRespOne);
    renderWithProviders(<UpcList />, { store });

    const deselectAll = await screen.findByTestId("upc-deselect-all-btn");
    await user.click(deselectAll);

    await waitFor(() => {
      const state = store.getState().upc;
      expect(state.selectedAssociationUpcParam.length).toBe(0);
    });
  });

  it("should handle selecting/deselecting upcs in UpcControls", async () => {
    (getItemAssociation as Mock).mockResolvedValue(selectAllRespOne);
    renderWithProviders(<UpcList />, { store });

    const upcOne = await screen.findByTestId("check-0");
    await user.click(upcOne);
    await user.click(upcOne);

    await waitFor(() => {
      const state = store.getState().upc;
      expect(state.selectedAssociationUpcParam.length).toBe(0);
    });
  });

  it("should handle selecting all upcs in UpcControls to fetch Associations", async () => {
    (getItemAssociation as Mock).mockResolvedValue(selectAllRespOne);
    renderWithProviders(<UpcList />, { store });

    const selectAll = await screen.findByTestId("upc-select-all-btn");
    await user.click(selectAll);
  });

  it("should handle API error when fetching from a level", async () => {
    (getItemAssociation as Mock).mockRejectedValue(JsonErrorResp);
    renderWithProviders(<UpcList />, { store });

    const lvlOneItem = await screen.findByTestId("item-lvl-1-0");
    await user.click(lvlOneItem);
    expect(mockedToastError).toHaveBeenCalled();
  });

  it("should notify the user no data was found if none", async () => {
    (getItemAssociation as Mock).mockResolvedValue({ data: { error: 1 } });
    renderWithProviders(<UpcList />, { store });

    const lvlOneItem = await screen.findByTestId("item-lvl-1-0");
    await user.click(lvlOneItem);

    // if error !== 0, then we do nothing and item associations should stay length of 2 here
    await waitFor(() => {
      const state = store.getState().upc;
      expect(state.itemAssociations.length).toBe(2);
    });
  });

  // Now in this test, we get 200 response code so we can start adding/removing more from lvl 1
  it("should open level two when selecting from level one", async () => {
    (getItemAssociation as Mock).mockResolvedValue(lvlOneResp);
    renderWithProviders(<UpcList />, { store });

    const lvlOneItem = await screen.findByTestId("item-lvl-1-0");
    await user.click(lvlOneItem);

    await waitFor(() => {
      const state = store.getState().upc;
      // original set from file is 15 upcs
      expect(state.selectedAssociationUpcParam.length).toBe(16);
    });
  });

  it("should requery when adding another upc from lvl 1", async () => {
    (getItemAssociation as Mock).mockResolvedValue(lvlOneMultiResp);
    renderWithProviders(<UpcList />, { store });

    const lvlOneItem = await screen.findByTestId("item-lvl-1-1");
    await user.click(lvlOneItem);

    await waitFor(() => {
      const state = store.getState().upc;
      // original set from file is 15 upcs => we now have two selected from lvl 1
      expect(state.selectedAssociationUpcParam.length).toBe(17);
    });
  });

  it("should requery when deselecting from lvl 1 when there were multiple selected", async () => {
    (getItemAssociation as Mock).mockResolvedValue(lvlOneResp);
    renderWithProviders(<UpcList />, { store });

    const lvlOneItem = await screen.findByTestId("item-lvl-1-1");
    await user.click(lvlOneItem);

    await waitFor(() => {
      const state = store.getState().upc;
      expect(state.selectedAssociationUpcParam.length).toBe(16);
    });
  });

  it("should handle lvl 2 item selection", async () => {
    (getItemAssociation as Mock).mockResolvedValue(lvl2Resp);
    renderWithProviders(<UpcList />, { store });

    const lvlTwoItem = await screen.findByTestId("item-lvl-2-0");
    await user.click(lvlTwoItem);

    await waitFor(() => {
      const state = store.getState().upc;
      expect(state.selectedAssociationUpcParam.length).toBe(17);
    });
  });

  it("should requery when adding another upc from lvl 2", async () => {
    (getItemAssociation as Mock).mockResolvedValue(lvl2MultiResp);
    renderWithProviders(<UpcList />, { store });

    const lvlTwoItem = await screen.findByTestId("item-lvl-2-1");
    await user.click(lvlTwoItem);

    await waitFor(() => {
      const state = store.getState().upc;
      expect(state.selectedAssociationUpcParam.length).toBe(18);
    });
  });

  it("should requery when deselecting from lvl 2", async () => {
    (getItemAssociation as Mock).mockResolvedValue(lvl2MultiResp);
    renderWithProviders(<UpcList />, { store });

    const lvlTwoItem = await screen.findByTestId("item-lvl-2-1");
    await user.click(lvlTwoItem);

    await waitFor(() => {
      const state = store.getState().upc;
      expect(state.selectedAssociationUpcParam.length).toBe(17);
    });
  });

  it("should do nothing if clicking on main or lvl 3 items", async () => {
    renderWithProviders(<UpcList />, { store });

    const mainLvlItem = await screen.findByTestId("item-lvl-0-0");
    await user.click(mainLvlItem);

    await waitFor(() => {
      const state = store.getState().upc;
      expect(state.selectedAssociationUpcParam.length).toBe(17);
    });
  });

  // Next handle the single upc search (copy to clipboard test as well) and then the exporting of the data
  it("should handle copying a upc from an item's card", async () => {
    renderWithProviders(<UpcList />, { store });

    const lvl3Item = await screen.findByTestId("item-lvl-3-0");
    // right click to copy the UPC
    fireEvent.contextMenu(lvl3Item);

    const ctx = await screen.findByTestId("ctx-menu-option-0");
    await user.click(ctx);

    // rightclick and paste intotheinput
    const input = await screen.findByTestId("input-");
    await waitFor(async () => {
      const state = store.getState().ctxMenu.clipboardText;
      await user.type(input, state.upc);
    });
  });

  // 22710000000
  it("should handle API Failure when fetching single upc associations", async () => {
    (getItemAssociation as Mock).mockRejectedValue(JsonErrorResp);
    renderWithProviders(<UpcList />, { store });
    // const input = await screen.findByTestId("input-");
    // await user.type(input, "22710000000");

    const searchBtn = await screen.findByTestId(
      "single-upc-association-search-btn",
    );

    await user.click(searchBtn);

    await waitFor(() => {
      expect(mockedToastError).toHaveBeenCalled();
    });
  });

  it("should do nothing if no data returns when fetching single upc associations", async () => {
    (getItemAssociation as Mock).mockResolvedValue({ data: { error: 1 } });
    renderWithProviders(<UpcList />, { store });
    // const input = await screen.findByTestId("input-");
    // await user.type(input, "22710000000");

    const searchBtn = await screen.findByTestId(
      "single-upc-association-search-btn",
    );

    await user.click(searchBtn);
  });

  it("should handle API Success when fetching single upc associations", async () => {
    (getItemAssociation as Mock).mockResolvedValue(singleUpcAssociationResp);
    renderWithProviders(<UpcList />, { store });
    const input = await screen.findByTestId("input-");
    await user.type(input, "22710000000");

    const searchBtn = await screen.findByTestId(
      "single-upc-association-search-btn",
    );

    await user.click(searchBtn);
  });

  it("should handle toast warning if exporting without a file name typed", async () => {
    renderWithProviders(<UpcList />, { store });

    const exportBtn = await screen.findByTestId("upc-controls-export-btn");
    await user.click(exportBtn);

    const modal = await screen.findByTestId("modal");
    expect(modal).toBeInTheDocument();

    const submitBtn = await screen.findByTestId("upc-export-modal-submit-btn");
    await user.click(submitBtn);

    await waitFor(() => {
      expect(mockedToastWarn).toHaveBeenCalled();
    });
  });

  it("should handle exporting of the Upc Association Data", async () => {
    renderWithProviders(<UpcList />, { store });

    const exportBtn = await screen.findByTestId("upc-controls-export-btn");
    await user.click(exportBtn);

    const modal = await screen.findByTestId("modal");
    expect(modal).toBeInTheDocument();

    const input = await screen.findByTestId("text-input-csvFileName");
    const submitBtn = await screen.findByTestId("upc-export-modal-submit-btn");

    await user.type(input, "test-file-name.csv");
    await user.click(submitBtn);

    expect(modal).not.toBeInTheDocument();
  });

  it("should handle clearing the single upc association column", async () => {
    renderWithProviders(<UpcList />, { store });

    const clearBtn = await screen.findByTestId(
      "single-upc-association-clear-btn",
    );
    await user.click(clearBtn);

    await waitFor(() => {
      const state = store.getState().upc;
      expect(state.singleItemAssociations.length).toBe(0);
    });
  });
});
