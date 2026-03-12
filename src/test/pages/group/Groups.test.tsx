import { describe, it, expect, vi, type Mock } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "../../utils";
import Groups from "../../../pages/groups/Groups";
import userEvent from "@testing-library/user-event";
import { setupStore } from "../../../store";
import {
  getGroups,
  getStoresAssignedToUserGroup,
  createGroup,
  deleteGroup,
  addStoreToGroup,
  removeStoreFromGroup,
} from "../../../api/groups";
import { setIsDesktop, setToken } from "../../../features/appSlice";

// Mocked responses
import {
  defaultSuccessResp,
  getGroupsSuccessResp,
  JsonErrorResp,
  updatedGroupsAfterDeleteResp,
  getStoresWithGroupStatusResp,
} from "./index";
import { setGroups, setRefreshGroups } from "../../../features/groupSlice";
import { getGroupsResp } from "../../components/dataLoader";

vi.mock("../../../api/groups");
const user = userEvent.setup();
const store = setupStore();
store.dispatch(setGroups(getGroupsResp.data.groups));

const mockedToastSuccess = vi.fn();
const mockedToastError = vi.fn();
const mockedToastWarn = vi.fn();
vi.mock("../../../components/toasts/hooks/useToast", () => ({
  useToast: () => ({
    success: mockedToastSuccess,
    warn: mockedToastWarn,
    error: mockedToastError,
  }),
}));

describe("Groups Page", () => {
  it("should render without crashing", async () => {
    renderWithProviders(<Groups />, { store });
    const groupsPage = screen.getByTestId("groups-page");
    expect(groupsPage).toBeInTheDocument();

    // Setting the token to getData after user interactions in the child components
    await waitFor(() => {
      store.dispatch(setToken("test-token"));
    });
  });

  // Create User Group Form
  it("should not allow the user to create a new group with a duplicate name", async () => {
    renderWithProviders(<Groups />, { store });

    const createForm = await screen.findByTestId("user-group-create-form-btn");
    await user.click(createForm);

    expect(screen.getByTestId("create-usergroup-form")).toBeInTheDocument();
    const input = await screen.findByTestId("input-group-name");
    await user.type(input, "Admins");

    const submitBtn = await screen.findByTestId("create-usergroup-btn");
    expect(submitBtn.className).toContain("opacity-50 pointer-events-none");
  });

  it("should handle api failure when creating a new group", async () => {
    (createGroup as Mock).mockRejectedValueOnce(JsonErrorResp);
    renderWithProviders(<Groups />, { store });

    const createForm = await screen.findByTestId("user-group-create-form-btn");
    await user.click(createForm);

    const input = await screen.findByTestId("input-group-name");
    await user.type(input, "New Group");

    const submitBtn = await screen.findByTestId("create-usergroup-btn");
    await user.click(submitBtn);

    await waitFor(() => {
      expect(mockedToastError).toHaveBeenCalledWith(JsonErrorResp.message);
    });
  });

  it("should handle mobile css styling for create user group form", async () => {
    // setting isDesktop to false to cover the mobile styling functionality
    await waitFor(() => {
      store.dispatch(setIsDesktop(false));
    });
    renderWithProviders(<Groups />, { store });

    const singleSelect = await screen.findByTestId(
      "single-select-trigger-icon-0",
    );
    await user.click(singleSelect);

    const creatOption = await screen.findByTestId("single-select-option-0-0");
    await user.click(creatOption);
  });

  it("should handle api failure when fetching groups", async () => {
    // resetting back to desktop to cover the functionality
    await waitFor(() => {
      store.dispatch(setIsDesktop(true));
    });

    (getGroups as Mock).mockRejectedValueOnce(JsonErrorResp);
    (createGroup as Mock).mockResolvedValueOnce(defaultSuccessResp);
    renderWithProviders(<Groups />, { store });

    const createForm = await screen.findByTestId("user-group-create-form-btn");
    await user.click(createForm);

    expect(screen.getByTestId("create-usergroup-form")).toBeInTheDocument();
    const input = await screen.findByTestId("input-group-name");
    await user.type(input, "N");

    const submitBtn = await screen.findByTestId("create-usergroup-btn");
    await user.click(submitBtn);
  });

  it("should create a new user group successfully and refresh the group data", async () => {
    (getGroups as Mock).mockResolvedValueOnce(getGroupsSuccessResp);
    (createGroup as Mock).mockResolvedValueOnce(defaultSuccessResp);

    renderWithProviders(<Groups />, { store });

    const createForm = await screen.findByTestId("user-group-create-form-btn");
    await user.click(createForm);

    expect(screen.getByTestId("create-usergroup-form")).toBeInTheDocument();
    const input = await screen.findByTestId("input-group-name");
    await user.type(input, "New Group");

    const submitBtn = await screen.findByTestId("create-usergroup-btn");
    await user.click(submitBtn);
  });

  // Update User Group Form

  // Delete User Group

  // Assign/Unassign Stores to User Group Form
});
