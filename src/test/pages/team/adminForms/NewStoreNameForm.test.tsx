import { describe, it, expect, vi, type Mock } from "vitest";
import { renderWithProviders } from "../../../utils";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { getAllUsers, getUserStores } from "../../../../api/user";
import { getQuicksightUsers } from "../../../../api/quicksight";
import { getUserLevels } from "../../../../api/team";
import { setNewStoreName } from "../../../../api/admin";

import {
  allUsersResp,
  defaultResp,
  loggedInUserCompanies,
  qsUserResp,
  userLvlResp,
  userStoresResp,
} from "..";
import { assignedStores, unassignedStores } from ".";

import { setupStore } from "../../../../store";
import Team from "../../../../pages/team/TeamLegacy";
import {
  setAssignedStores,
  setCompanies,
  setUnassignedStores,
} from "../../../../features/userSlice";

const user = userEvent.setup();
const store = setupStore();
store.dispatch(setCompanies(loggedInUserCompanies));
store.dispatch(setAssignedStores(assignedStores));
store.dispatch(setUnassignedStores(unassignedStores));

vi.mock("../../../../api/quicksight");
vi.mock("../../../../api/team");
vi.mock("../../../../api/user");
vi.mock("../../../../api/admin");

const defaultRender = () => {
  (getUserStores as Mock).mockResolvedValue(userStoresResp);
  (getAllUsers as Mock).mockResolvedValue(allUsersResp);
  (getQuicksightUsers as Mock).mockResolvedValue(qsUserResp);
  (getUserLevels as Mock).mockResolvedValue(userLvlResp);
  renderWithProviders(<Team />, { store });
};

describe("New Store Name Form", () => {
  it("should handle renaming a store for a company", async () => {
    defaultRender();
    (setNewStoreName as Mock).mockResolvedValue(defaultResp);
    const adminForm = await screen.findByTestId("team-admin-form");
    await user.click(adminForm);

    const newStoreNameForm = await screen.findByTestId(
      "admin-new-store-name-form",
    );
    await user.click(newStoreNameForm);

    const singleSelect = await screen.findByTestId(
      "single-select-trigger-icon-3",
    );
    await user.click(singleSelect);

    const storeOption = await screen.findByTestId("single-select-option-3-2");
    await user.click(storeOption);

    const input = await screen.findByTestId("input-new-store-name");
    await user.type(input, "New Store Name");

    const submitBtn = await screen.findByTestId("submit-new-store-name-btn");
    await user.click(submitBtn);
  });

  it("should allow the user to filter by company and assigned/unassigned stores", async () => {
    defaultRender();
    const adminForm = await screen.findByTestId("team-admin-form");
    await user.click(adminForm);

    const newStoreNameForm = await screen.findByTestId(
      "admin-new-store-name-form",
    );
    await user.click(newStoreNameForm);

    const companySelect = await screen.findByTestId(
      "single-select-trigger-icon-1",
    );
    const assignmentSelect = await screen.findByTestId(
      "single-select-trigger-icon-2",
    );

    await user.click(companySelect);
    const companyOption = await screen.findByTestId("single-select-option-1-2");
    await user.click(companyOption);

    await user.click(assignmentSelect);
    const assignmentOption = await screen.findByTestId(
      "single-select-option-2-2",
    );
    await user.click(assignmentOption);

    await user.click(assignmentSelect);
    const unassignedOption = await screen.findByTestId(
      "single-select-option-2-1",
    );
    await user.click(unassignedOption);
  });

  it("should handle api error when sending a new store name", async () => {
    defaultRender();
    (setNewStoreName as Mock).mockRejectedValue(new Error("API Error"));
    const adminForm = await screen.findByTestId("team-admin-form");
    await user.click(adminForm);

    const newStoreNameForm = await screen.findByTestId(
      "admin-new-store-name-form",
    );
    await user.click(newStoreNameForm);

    const singleSelect = await screen.findByTestId(
      "single-select-trigger-icon-3",
    );
    await user.click(singleSelect);

    const storeOption = await screen.findByTestId("single-select-option-3-2");
    await user.click(storeOption);

    const input = await screen.findByTestId("input-new-store-name");
    await user.type(input, "New Store Name");

    const submitBtn = await screen.findByTestId("submit-new-store-name-btn");
    await user.click(submitBtn);
  });

  it("should handle api error when refetching user stores", async () => {
    defaultRender();
    (setNewStoreName as Mock).mockResolvedValue(defaultResp);
    const adminForm = await screen.findByTestId("team-admin-form");
    await user.click(adminForm);
    
    const newStoreNameForm = await screen.findByTestId(
      "admin-new-store-name-form",
    );
    await user.click(newStoreNameForm);
    
    const singleSelect = await screen.findByTestId(
      "single-select-trigger-icon-3",
    );
    await user.click(singleSelect);
    
    const storeOption = await screen.findByTestId("single-select-option-3-2");
    await user.click(storeOption);
    
    const input = await screen.findByTestId("input-new-store-name");
    await user.type(input, "New Store Name");
    
    (getUserStores as Mock).mockRejectedValue(new Error("API Error"));
    const submitBtn = await screen.findByTestId("submit-new-store-name-btn");
    await user.click(submitBtn);
  });

  it("should do nothing if typing in the Selected Store Name input", async () => {
    defaultRender();
    const adminForm = await screen.findByTestId("team-admin-form");
    await user.click(adminForm);

    const input = await screen.findByTestId("input-selected-store-name");
    await user.type(input, "Trying to type");

    expect(input).toHaveValue("");
  });
});
