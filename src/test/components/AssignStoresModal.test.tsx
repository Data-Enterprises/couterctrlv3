import { describe, it, expect, vi, type Mock } from "vitest";
import { renderWithProviders } from "../utils";
import { setupStore } from "../../store";
import { getUserStores } from "../../api/user";
import AssignStoresModal from "../../pages/team/assignModal/AssignStoresModal";
import { waitFor, screen } from "@testing-library/react";
import type { UserData } from "../../features/usersSlice";
import { getQuicksightStoresForUser } from "../../api/quicksight";
import userEvent from "@testing-library/user-event";

const user = userEvent.setup();
vi.mock("../../api/user");
vi.mock("../../api/quicksight");
const mockedToastError = vi.fn();
vi.mock("../../api/team");
vi.mock("../../components/toasts/hooks/useToast", () => ({
  useToast: () => ({
    error: mockedToastError,
  }),
}));

const defaultInfo: UserData = {
  username: "",
  email: "",
  first_name: "",
  last_name: "",
  password: "",
  user_level: 0,
  company: 0,
  confirm_password: "",
  role: 9,
};

describe("AssignStoresModal Component", () => {
  it("should render modal with title and buttons", () => {
    const store = setupStore(); // Fresh store
    renderWithProviders(<AssignStoresModal />, { store });
  });

  it("Should fetch data when modal is opened", async () => {
    const store = setupStore(); // Fresh store

    await waitFor(() => {
      store.dispatch({ type: "users/setAssignModalOpen", payload: true });
      store.dispatch({ type: "users/setSelectedUserId", payload: 123 }); // Set ID to avoid undefined
    });

    (getUserStores as Mock).mockResolvedValue({
      data: {
        error: 0,
        assigned_stores: [
          { storeid: 1, store_name: "Store 1", store_number: "001" },
        ],
        unassigned_stores: [
          { storeid: 2, store_name: "Store 2", store_number: "002" },
        ],
      },
    });
    renderWithProviders(<AssignStoresModal />, { store });

    await waitFor(() => {
      store.dispatch({ type: "users/setAssignModalOpen", payload: false });
    });
  });

  it("should handle filtering unassigned/assigned stores for CounterCtrl Stores", async () => {
    const store = setupStore(); // Fresh store

    await waitFor(() => {
      store.dispatch({ type: "users/setAssignModalOpen", payload: true });
      store.dispatch({ type: "users/setSelectedUserId", payload: 123 }); // Set ID to avoid undefined
    });

    (getUserStores as Mock).mockResolvedValue({
      data: {
        error: 0,
        assigned_stores: [
          { storeid: 1, store_name: "Store 1", store_number: "001" },
        ],
        unassigned_stores: [
          { storeid: 2, store_name: "Store 2", store_number: "002" },
        ],
      },
    });
    renderWithProviders(<AssignStoresModal />, { store });

    const unassignedFilter = await screen.findByTestId(
      "ctrl-unassigned-filter"
    );
    const assignedFilter = await screen.findByTestId("ctrl-assigned-filter");

    await user.type(unassignedFilter, "Store 2");
    expect(unassignedFilter).toHaveValue("Store 2");

    await user.type(assignedFilter, "Store 1");
    expect(assignedFilter).toHaveValue("Store 1");
  });

  it("handles API failure gracefully", async () => {
    const store = setupStore(); // Fresh store
    await waitFor(() => {
      store.dispatch({ type: "users/setAssignModalOpen", payload: true });
    });

    (getUserStores as Mock).mockRejectedValue(new Error("Network Error"));
    renderWithProviders(<AssignStoresModal />, { store });

    await waitFor(() => {
      expect(mockedToastError).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      store.dispatch({ type: "users/setAssignModalOpen", payload: false });
    });
  });

  it("render role's label if role is assigned", async () => {
    const store = setupStore(); // Fresh store
    // role = 9 matches your defaultInfo
    await waitFor(() => {
      store.dispatch({ type: "users/setRole", payload: defaultInfo.role });
      store.dispatch({ type: "users/setAssignModalOpen", payload: true });
    });

    // Make getUserStores safe (returns a promise) but irrelevant for this branch
    (getUserStores as Mock).mockResolvedValue({
      data: {
        error: 1,
      },
    });

    renderWithProviders(<AssignStoresModal />);

    await waitFor(() => {
      const state = store.getState().users;
      expect(state.userInfo.role).toBe(9);
    });
  });
});
