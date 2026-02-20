// import { describe, it, expect, vi, type Mock } from "vitest";
import { describe, it, vi } from "vitest";
// import { renderWithProviders } from "../../utils";
// import { screen, waitFor } from "@testing-library/react";
// import userEvent from "@testing-library/user-event";

// import {
//   createUser,
//   getBaseGroupsAssignedToUser,
//   updateUser,
//   deleteUserBaseGroupLink,
//   assignBaseGroupToUser,
//   resetUserSecurityQuestion,
//   unassignUserFromStore,
//   assignUserToStore,
//   deleteUser,
// } from "../../../api/team";
// import { getAllUsers, getUserStores } from "../../../api/user";
// import {
//   addQuicksightStoreForUser,
//   assignAllPermissionsForUser,
//   getQuicksightStoresForUser,
//   getQuicksightUsers,
//   removeAllPermissionsForUser,
//   removeQuicksightStoreForUser,
// } from "../../../api/quicksight";
// import { setTempPassword } from "../../../api/security";
// import {
//   baseGroupResp,
//   allUsersResp,
//   updateUserResp,
//   deleteUpdateBaseGroupLinkResp,
//   defaultResp,
//   userStoresResp,
//   updatedUserStoresResp,
//   qsUserResp,
// } from ".";
// import { setupStore } from "../../../store";
// import Team from "../../../pages/team/Team";

// const user = userEvent.setup();
// const store = setupStore();
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

describe("Team Page", () => {
  it("should render", async () => {});
});
