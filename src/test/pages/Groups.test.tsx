import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../utils";
import Groups from "../../pages/groups/Groups";
import userEvent from "@testing-library/user-event";
import { mockStore as store } from "../mockStore";

const user = userEvent.setup();

describe("Groups Page", () => {
  it("should render Groups page with initial group state", () => {
    renderWithProviders(<Groups />);
    const groupsPage = screen.getByTestId("groups-page");
    const groupList = screen.getByTestId("group-list");
    const createGroup = screen.getByTestId("create-group");
    const selectGroup = screen.getByTestId("select-group");

    expect(createGroup).toBeInTheDocument();
    expect(selectGroup).toBeInTheDocument();
    expect(groupList).toBeInTheDocument();
    expect(groupsPage).toBeInTheDocument();

    const state = store.getState();
    expect(state.group.groups).toEqual([]);
    expect(state.group.createInput).toEqual("");
    expect(state.group.refreshGroups).toEqual(false);
    expect(state.group.filterOption).toEqual("all");
    expect(state.group.selectedGroup).toEqual(null);
  });

  it("should handle state change", async () => {
    renderWithProviders(<Groups />);
    const input = screen.getByTestId("create-group-input");

    await user.type(input, "Test Group");

    // Make sure the redux state is updated, grab the state after user interaction
    const state = store.getState();
    expect(state.group.createInput).toEqual("Test Group");

    console.log(state.group);
  });
});
