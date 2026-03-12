import { describe, expect, it, vi, type Mock } from "vitest";
import { waitFor } from "@testing-library/react";
import { setupStore } from "../../../store";
import { renderWithProviders } from "../../utils";
import UserDataLoader from "../../../components/UserDataLoader";
import { setToken } from "../../../features/appSlice";

import { getUserStores, getUserPrefs } from "../../../api/user";
import { getGroups } from "../../../api/groups";
import {
  JsonErrorResp,
  userPrefsResp,
  userStoresResp,
  getGroupsResp,
  userPrefsResp2,
  userPrefsResp3,
  userPrefsResp4,
  userPrefsFalseResp,
} from ".";

vi.mock("../../../api/user");
vi.mock("../../../api/groups");
const mockedToastError = vi.fn();
vi.mock("../../../components/toasts/hooks/useToast", () => ({
  useToast: () => ({
    error: mockedToastError,
  }),
}));

describe("UserDataLoader Component", () => {
  it("should do nothing when loading and no access token as been set", async () => {
    renderWithProviders(<UserDataLoader />);
    expect(getUserStores).not.toHaveBeenCalled();
    expect(getUserPrefs).not.toHaveBeenCalled();
    expect(getGroups).not.toHaveBeenCalled();
  });

  it("should handle error when fetching user prefs fails", async () => {
    const rejectStore = setupStore();
    await waitFor(() => {
      rejectStore.dispatch(setToken("valid-token"));
    });
    (getUserPrefs as Mock).mockRejectedValueOnce(JsonErrorResp);
    (getUserStores as Mock).mockRejectedValue(JsonErrorResp);
    (getGroups as Mock).mockRejectedValue(JsonErrorResp);
    renderWithProviders(<UserDataLoader />, { store: rejectStore });
    await waitFor(() => {
      expect(mockedToastError).toHaveBeenCalled();
    });
  });

  it("should do nothing if error is not 0 in the then block of the api calls", async () => {
    const store = setupStore();
    await waitFor(() => {
      store.dispatch(setToken("valid-token"));
    });

    (getUserPrefs as Mock).mockResolvedValue(userPrefsFalseResp);
    (getUserStores as Mock).mockResolvedValue(userPrefsFalseResp);
    (getGroups as Mock).mockResolvedValue(userPrefsFalseResp);
    renderWithProviders(<UserDataLoader />, { store });
  });

  it("should fetch user data when a valid access token is set", async () => {
    const store = setupStore();
    await waitFor(() => {
      store.dispatch(setToken("valid-token"));
    });

    (getUserPrefs as Mock).mockResolvedValue(userPrefsResp);
    (getUserStores as Mock).mockResolvedValue(userStoresResp);
    (getGroups as Mock).mockResolvedValue(getGroupsResp);
    renderWithProviders(<UserDataLoader />, { store });
  });

  // it("should handle old search type 1 and set it to Stores", async () => {
  //   const store = setupStore();
  //   await waitFor(() => {
  //     store.dispatch(setToken("valid-token"));
  //   });
  //   (getUserPrefs as Mock).mockResolvedValue(userPrefsResp1);
  //   (getUserStores as Mock).mockResolvedValue(userStoresResp);
  //   (getGroups as Mock).mockResolvedValue(getGroupsResp);
  //   renderWithProviders(<UserDataLoader />, { store });

  //   await waitFor(() => {
  //     const state = store.getState();
  //     expect(state.search.type).toBe("Stores");
  //   });
  // });

  it("should handle old search type 2 and set it to Group", async () => {
    const store = setupStore();
    await waitFor(() => {
      store.dispatch(setToken("valid-token"));
    });
    (getUserPrefs as Mock).mockResolvedValue(userPrefsResp2);
    (getUserStores as Mock).mockResolvedValue(userStoresResp);
    (getGroups as Mock).mockResolvedValue(getGroupsResp);
    renderWithProviders(<UserDataLoader />, { store });

    await waitFor(() => {
      const state = store.getState();
      expect(state.search.type).toBe("Group");
    });
  });

  it("should handle old search type 3 and set it to store", async () => {
    const store = setupStore();
    await waitFor(() => {
      store.dispatch(setToken("valid-token"));
    });
    (getUserPrefs as Mock).mockResolvedValue(userPrefsResp3);
    (getUserStores as Mock).mockResolvedValue(userStoresResp);
    (getGroups as Mock).mockResolvedValue(getGroupsResp);
    renderWithProviders(<UserDataLoader />, { store });

    await waitFor(() => {
      const state = store.getState();
      expect(state.search.type).toBe("Store");
    });
  });

  it("should handle missing data from test users or new users", async () => {
    const store = setupStore();
    await waitFor(() => {
      store.dispatch(setToken("valid-token"));
    });
    (getUserPrefs as Mock).mockResolvedValue(userPrefsResp4);
    (getUserStores as Mock).mockResolvedValue(userStoresResp);
    (getGroups as Mock).mockResolvedValue(getGroupsResp);
    renderWithProviders(<UserDataLoader />, { store });

    await waitFor(() => {
      const state = store.getState();
      expect(state.search.type).toBe("Store");
    });
  });

  it("should throw error on api failuer for fetching groups", async () => {
    const store = setupStore();
    await waitFor(() => {
      store.dispatch(setToken("valid-token"));
    });
    (getUserPrefs as Mock).mockResolvedValue(userPrefsResp4);
    (getUserStores as Mock).mockResolvedValue(userStoresResp);
    (getGroups as Mock).mockRejectedValueOnce(new Error("API Error"));
    renderWithProviders(<UserDataLoader />, { store });

    await waitFor(() => {
      expect(mockedToastError).toHaveBeenCalledWith("API Error");
    });
  });

  it("should throw error on api failuer for fetching user stores", async () => {
    const store = setupStore();
    await waitFor(() => {
      store.dispatch(setToken("valid-token"));
    });
    (getUserPrefs as Mock).mockResolvedValue(userPrefsResp4);
    (getUserStores as Mock).mockRejectedValueOnce(new Error("API Error"));
    (getGroups as Mock).mockResolvedValue(getGroupsResp);
    renderWithProviders(<UserDataLoader />, { store });

    await waitFor(() => {
      expect(mockedToastError).toHaveBeenCalledWith(
        "Error getting user stores: API Error"
      );
    });
  });
});
