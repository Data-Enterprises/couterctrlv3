import { describe, it, expect, vi, type Mock } from "vitest";
import { renderWithProviders } from "../../utils";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import {
  createUser,
  getBaseGroupsAssignedToUser,
  updateUser,
  deleteUserBaseGroupLink,
  assignBaseGroupToUser,
  resetUserSecurityQuestion,
  unassignUserFromStore,
  assignUserToStore,
  deleteUser,
  getUserLevels,
} from "../../../api/team";
import { getAllUsers, getUserStores } from "../../../api/user";
import {
  addQuicksightStoreForUser,
  assignAllPermissionsForUser,
  getQuicksightStoresForUser,
  getQuicksightUsers,
  removeAllPermissionsForUser,
  removeQuicksightStoreForUser,
} from "../../../api/quicksight";
import { setTempPassword } from "../../../api/security";
import {
  baseGroupResp,
  allUsersResp,
  updateUserResp,
  deleteUpdateBaseGroupLinkResp,
  defaultResp,
  userStoresResp,
  updatedUserStoresResp,
  qsUserResp,
  loggedInUserCompanies,
  userLvlResp,
  nonDCRUserCompanies,
} from ".";
import { setupStore } from "../../../store";
import Team from "../../../pages/team/Team";
import { setCompanies } from "../../../features/userSlice";
import { defaultError } from "../sales";

const user = userEvent.setup();

const store = setupStore();
store.dispatch(setCompanies(nonDCRUserCompanies));

const dcrStore = setupStore();
dcrStore.dispatch(setCompanies(loggedInUserCompanies));

const mockedToastSuccess = vi.fn();
const mockedToastError = vi.fn();
const mockedToastWarning = vi.fn();

vi.mock("../../../api/quicksight");
vi.mock("../../../api/security");
vi.mock("../../../api/team");
vi.mock("../../../api/user");
vi.mock("../../../components/toasts/hooks/useToast", () => ({
  useToast: () => ({
    success: mockedToastSuccess,
    error: mockedToastError,
    warn: mockedToastWarning,
  }),
}));

const defaultRender = (type: "dcr" | "nonDcr" = "dcr") => {
  const storeToUse = type === "dcr" ? dcrStore : store;
  (getAllUsers as Mock).mockResolvedValueOnce(allUsersResp);
  (getQuicksightUsers as Mock).mockResolvedValueOnce(qsUserResp);
  (getUserLevels as Mock).mockResolvedValueOnce(userLvlResp);
  renderWithProviders(<Team />, { store: storeToUse });
};

describe("Team Page Users Form (DCR user)", () => {
  it("should handle api failure when fetching all users", async () => {
    (getAllUsers as Mock).mockRejectedValue(defaultError);
    (getQuicksightUsers as Mock).mockRejectedValue(defaultError);
    (getUserLevels as Mock).mockRejectedValue(defaultError);
    renderWithProviders(<Team />, { store });
  });

  it("should handle DCR users", async () => {
    defaultRender();
    await waitFor(() => {
      const state = dcrStore.getState().user.companies;
      console.log("DCR user companies: ", state);
    });
  });
});
