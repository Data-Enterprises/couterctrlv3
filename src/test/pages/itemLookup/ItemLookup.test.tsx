import { describe, expect, it, vi, type Mock } from "vitest";
import { renderWithProviders } from "../../utils";
import ItemLookup from "../../../pages/lookup/ItemLookup";
import { setupStore } from "../../../store";
import userEvent from "@testing-library/user-event";

import {
  getItemLookup,
  getItemLookupSingleStore,
  getStoreList,
} from "../../../api/itemLookup";
import {
  defaultError,
  itemLookupResp,
  itemLookupSingleStoreResp,
  itemLookupWarnResp,
  storeListResp,
} from ".";
import { screen, waitFor } from "@testing-library/react";
import { setPause } from "../../../features/itemLookupSlice";
import { useMediaDevices } from "react-media-devices";

const user = userEvent.setup();
const store = setupStore();
vi.mock("../../../api/itemLookup");

const mockToastError = vi.fn();
vi.mock("../../../components/toasts/hooks/useToast", () => {
  return {
    useToast: () => ({
      error: mockToastError,
    }),
  };
});

// Need to mock react-media-devices so test env can immulate the media devices
vi.mock("react-media-devices", () => ({
  useMediaDevices: vi.fn(),
}));
const mockedUseMediaDevices = useMediaDevices as unknown as Mock;

// Need to mock quagga
vi.mock("@ericblade/quagga2", () => {
  const mockQuagga = {
    init: vi.fn((_config, cb) => cb && cb(null)),
    start: vi.fn(),
    stop: vi.fn(),
    offDetected: vi.fn(),
    onDetected: vi.fn(),
  };

  // Store the onDetected callback so we can trigger it manually
  let onDetectedCallback: ((result: any) => void) | null = null;

  Object.defineProperty(mockQuagga, "onDetected", {
    get: vi.fn(() => (callback: (result: any) => void) => {
      onDetectedCallback = callback;
    }),
    configurable: true,
  });

  // Expose a method to trigger detection for tests
  (mockQuagga as any).triggerDetection = (code: string) => {
    if (onDetectedCallback) {
      onDetectedCallback({
        codeResult: { code },
      });
    }
  };

  return {
    default: mockQuagga,
  };
});

describe("Item Lookup page", () => {
  it("should handle API error fecthing store list on moun", async () => {
    // EVERY TEST NEEDS TO MOCK MEDIA DEVICES
    mockedUseMediaDevices.mockReturnValue({
      devices: [
        { deviceId: "front-1", label: "Front Camera" },
        { deviceId: "back-1", label: "Back Camera" },
      ],
    });
    (getStoreList as Mock).mockRejectedValueOnce(defaultError);
    renderWithProviders(<ItemLookup />);
    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith("API Error");
    });
  });

  it("should fetch store list on mount", async () => {
    mockedUseMediaDevices.mockReturnValue({
      devices: [
        { deviceId: "front-1", label: "Front Camera" },
        { deviceId: "back-1", label: "Back Camera" },
      ],
    });
    (getStoreList as Mock).mockResolvedValue(storeListResp);
    renderWithProviders(<ItemLookup />, { store });
  });

  it("should set an error message if the item is not found for all stores", async () => {
    mockedUseMediaDevices.mockReturnValue({
      devices: [
        { deviceId: "front-1", label: "Front Camera" },
        { deviceId: "back-1", label: "Back Camera" },
      ],
    });
    (getStoreList as Mock).mockResolvedValue(storeListResp);
    (getItemLookup as Mock).mockResolvedValue(itemLookupWarnResp);
    renderWithProviders(<ItemLookup />, { store });

    const scan = await screen.findByTestId("scan-button");
    await user.click(scan);

    // Now trigger the detection callback
    const quaggaModule = await import("@ericblade/quagga2");
    (quaggaModule.default as any).triggerDetection("1234567890123");

    // Wait for the detection handler to process
    await waitFor(() => {
      expect(store.getState().item.itemsLoaded).toBe(false);
    });
  });

  it("should handle Quagga detection", async () => {
    mockedUseMediaDevices.mockReturnValue({
      devices: [
        { deviceId: "front-1", label: "Front Camera" },
        { deviceId: "back-1", label: "Back Camera" },
      ],
    });
    (getStoreList as Mock).mockResolvedValue(storeListResp);
    (getItemLookup as Mock).mockResolvedValue(itemLookupResp);
    renderWithProviders(<ItemLookup />, { store });

    const scan = await screen.findByTestId("scan-button");
    await user.click(scan);

    // Now trigger the detection callback
    const quaggaModule = await import("@ericblade/quagga2");
    (quaggaModule.default as any).triggerDetection("1234567890123");

    // Wait for the detection handler to process
    await waitFor(() => {
      expect(store.getState().item.upcCode).toBe("1234567890123");
      expect(store.getState().item.itemsLoaded).toBe(true);
    });
  });

  it("should handle Sales/Qty/Price mode changes after successful item lookup", async () => {
    mockedUseMediaDevices.mockReturnValue({
      devices: [
        { deviceId: "front-1", label: "Front Camera" },
        { deviceId: "back-1", label: "Back Camera" },
      ],
    });
    (getStoreList as Mock).mockResolvedValue(storeListResp);
    (getItemLookup as Mock).mockResolvedValue(itemLookupResp);
    renderWithProviders(<ItemLookup />, { store });

    const scan = await screen.findByTestId("scan-button");
    await user.click(scan);

    // Now trigger the detection callback
    const quaggaModule = await import("@ericblade/quagga2");
    (quaggaModule.default as any).triggerDetection("1234567890123");

    // Wait for the detection handler to process
    await waitFor(() => {
      expect(store.getState().item.upcCode).toBe("1234567890123");
      expect(store.getState().item.itemsLoaded).toBe(true);
    });

    // mode buttons
    const sales = await screen.findByTestId("lookup-header-sales");
    const qty = await screen.findByTestId("lookup-header-qty");
    const price = await screen.findByTestId("lookup-header-price");

    await user.click(qty);
    await user.click(price);
    await user.click(sales);
  });

  // Single store interactions
  it("should handle selecting a store", async () => {
    mockedUseMediaDevices.mockReturnValue({
      devices: [
        { deviceId: "front-1", label: "Front Camera" },
        { deviceId: "back-1", label: "Back Camera" },
      ],
    });
    renderWithProviders(<ItemLookup />, { store });

    const lookupSelectStore = await screen.findByTestId("lookup-select-store");
    await user.click(lookupSelectStore);

    const storeInput = await screen.findByTestId("lookup-store-input");
    await user.type(storeInput, "Store 1");

    const storeOption = await screen.findByText("Store 1");
    await user.click(storeOption);

    await waitFor(() => {
      expect(store.getState().item.selectedStore).toBe(1);
    });
  });

  it("should handle clearing the store before the api call", async () => {
    mockedUseMediaDevices.mockReturnValue({
      devices: [
        { deviceId: "front-1", label: "Front Camera" },
        { deviceId: "back-1", label: "Back Camera" },
      ],
    });
    renderWithProviders(<ItemLookup />, { store });
    const lookupSelectStore = await screen.findByTestId("lookup-select-store");
    await user.click(lookupSelectStore);

    const storeOption = await screen.findByText("Store 1");
    await user.click(storeOption);

    const clear = await screen.findByTestId("scan-item-clear-store");
    await user.click(clear);

    await waitFor(() => {
      const state = store.getState().item;
      expect(state.selectedStore).toBe(0);
    });
  });

  it("should handle user input for UPC code", async () => {
    mockedUseMediaDevices.mockReturnValue({
      devices: [
        { deviceId: "front-1", label: "Front Camera" },
        { deviceId: "back-1", label: "Back Camera" },
      ],
    });
    renderWithProviders(<ItemLookup />, { store });
    const lookupSelectStore = await screen.findByTestId("lookup-select-store");
    await user.click(lookupSelectStore);

    const storeInput = await screen.findByTestId("lookup-store-input");
    await user.type(storeInput, "Store 1");

    const storeOption = await screen.findByText("Store 1");
    await user.click(storeOption);

    await waitFor(() => {
      expect(store.getState().item.selectedStore).toBe(1);
    });

    const upcInput = await screen.findByTestId("scan-item-input");
    await user.type(upcInput, "1234567890123");

    await waitFor(() => {
      const state = store.getState().item;
      expect(state.upcCode).toBe("1234567890123");
    });
  });

  it("should handle api failure for single store item fetching", async () => {
    mockedUseMediaDevices.mockReturnValue({
      devices: [
        { deviceId: "front-1", label: "Front Camera" },
        { deviceId: "back-1", label: "Back Camera" },
      ],
    });
    (getItemLookupSingleStore as Mock).mockRejectedValue(defaultError);
    renderWithProviders(<ItemLookup />, { store });

    const lookupSelectStore = await screen.findByTestId("lookup-select-store");
    await user.click(lookupSelectStore);

    const storeOption = await screen.findByText("Store 1");
    await user.click(storeOption);

    const upcInput = await screen.findByTestId("scan-item-input");
    await user.type(upcInput, "1234567890123");

    // At this point, store 1 is still selected and our upc is typed
    const scan = await screen.findByTestId("scan-button");
    await user.click(scan);
  });

  it("should handle single selected store response when item is not found", async () => {
    mockedUseMediaDevices.mockReturnValue({
      devices: [
        { deviceId: "front-1", label: "Front Camera" },
        { deviceId: "back-1", label: "Back Camera" },
      ],
    });
    (getItemLookupSingleStore as Mock).mockResolvedValue(itemLookupWarnResp);
    renderWithProviders(<ItemLookup />, { store });

    const lookupSelectStore = await screen.findByTestId("lookup-select-store");
    await user.click(lookupSelectStore);

    const storeOption = await screen.findByText("Store 1");
    await user.click(storeOption);

    const upcInput = await screen.findByTestId("scan-item-input");
    await user.type(upcInput, "1234567890123");

    // At this point, store 1 is still selected and our upc is typed
    const scan = await screen.findByTestId("scan-button");
    await user.click(scan);
  });

  it("should successfully scan for a single selected store", async () => {
    mockedUseMediaDevices.mockReturnValue({
      devices: [
        { deviceId: "front-1", label: "Front Camera" },
        { deviceId: "back-1", label: "Back Camera" },
      ],
    });
    (getItemLookupSingleStore as Mock).mockResolvedValue(
      itemLookupSingleStoreResp
    );
    renderWithProviders(<ItemLookup />, { store });

    const lookupSelectStore = await screen.findByTestId("lookup-select-store");
    await user.click(lookupSelectStore);

    const storeOption = await screen.findByText("Store 1");
    await user.click(storeOption);

    const upcInput = await screen.findByTestId("scan-item-input");
    await user.type(upcInput, "1234567890123");

    // At this point, store 1 is still selected and our upc is typed
    const scan = await screen.findByTestId("scan-button");
    await user.click(scan);
  });

  it("should clear the ui when Clear is clicked", async () => {
    mockedUseMediaDevices.mockReturnValue({
      devices: [
        { deviceId: "front-1", label: "Front Camera" },
        { deviceId: "back-1", label: "Back Camera" },
      ],
    });
    (getItemLookupSingleStore as Mock).mockResolvedValue(
      itemLookupSingleStoreResp
    );
    renderWithProviders(<ItemLookup />, { store });

    const lookupSelectStore = await screen.findByTestId("lookup-select-store");
    await user.click(lookupSelectStore);

    const storeOption = await screen.findByText("Store 1");
    await user.click(storeOption);

    const upcInput = await screen.findByTestId("scan-item-input");
    await user.type(upcInput, "1234567890123");

    // At this point, store 1 is still selected and our upc is typed
    const scan = await screen.findByTestId("scan-button");
    await user.click(scan);

    // clear the data
    const clear = await screen.findByTestId("lookup-clear");
    await user.click(clear);

    await waitFor(() => {
      const state = store.getState().item;
      expect(state.selectedStore).toBe(0);
      expect(state.upcCode).toBe("");
    });
  });

  it("should handle opening and closing of camera", async () => {
    mockedUseMediaDevices.mockReturnValue({
      devices: [
        { deviceId: "front-1", label: "Front Camera" },
        { deviceId: "back-1", label: "Back Camera" },
      ],
    });
    (getItemLookup as Mock).mockResolvedValue(itemLookupResp);
    renderWithProviders(<ItemLookup />, { store });
    const upcInput = await screen.findByTestId("scan-item-input");
    await user.type(upcInput, "1234567890123");

    const scan = await screen.findByTestId("scan-button");
    await user.click(scan);
  });

  it("should handle auto scan for single selected store", async () => {
    mockedUseMediaDevices.mockReturnValue({
      devices: [
        { deviceId: "front-1", label: "Front Camera" },
        { deviceId: "back-1", label: "Back Camera" },
      ],
    });
    (getItemLookupSingleStore as Mock).mockResolvedValue(
      itemLookupSingleStoreResp
    );
    renderWithProviders(<ItemLookup />, { store });

    const lookupSelectStore = await screen.findByTestId("lookup-select-store");
    await user.click(lookupSelectStore);

    const storeOption = await screen.findByText("Store 1");
    await user.click(storeOption);

    const scan = await screen.findByTestId("scan-button");
    await user.click(scan);

    const quaggaModule = await import("@ericblade/quagga2");
    (quaggaModule.default as any).triggerDetection("1234567890123");

    const clear = await screen.findByTestId("lookup-clear");
    await user.click(clear);
  });

  it("should handle else logic in stopScanner function", async () => {
    mockedUseMediaDevices.mockReturnValue({
      devices: [
        { deviceId: "front-1", label: "Front Camera" },
        { deviceId: "back-1", label: "Back Camera" },
      ],
    });
    renderWithProviders(<ItemLookup />, { store });

    const scan = await screen.findByTestId("scan-button");

    // First click → starts the scanner (sets pause to false)
    await user.click(scan);

    // Force pause to be
    await waitFor(() => {
      store.dispatch(setPause(true));
    });

    // hit the else block of the stopScanner fct
    await user.click(scan);

    // Verify that Quagga stopped and pause toggled
    const quaggaModule = await import("@ericblade/quagga2");
    expect(quaggaModule.default.stop).toHaveBeenCalled();
    expect(quaggaModule.default.offDetected).toHaveBeenCalled();
  });

  it("should handle if logic in stopScanner", async () => {
    mockedUseMediaDevices.mockReturnValue({
      devices: [
        { deviceId: "front-1", label: "Front Camera" },
        { deviceId: "back-1", label: "Back Camera" },
      ],
    });
    renderWithProviders(<ItemLookup />, { store });
    const scan = await screen.findByTestId("scan-button");
    await user.click(scan);
    await user.click(scan);
  });
});
