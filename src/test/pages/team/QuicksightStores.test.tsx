import { describe, it, expect } from "vitest";
import { renderWithProviders } from "../../utils";
import { setupStore } from "../../../store";
import QuickSightStores from "../../../pages/team/assignModal/QuicksightStores";
import { waitFor } from "@testing-library/react";

describe("QuicksightStores Component", () => {
  it("should render without a last name", async () => {
    const store = setupStore();
    renderWithProviders(<QuickSightStores />, { store });

    await waitFor(() => {
      const state = store.getState().users;
      expect(state.userInfo.last_name).toBe("");
    });
  });
});
