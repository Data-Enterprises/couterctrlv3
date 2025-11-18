import { describe, it, expect } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "../utils";
import Groups from "../../pages/groups/Groups";
import userEvent from "@testing-library/user-event";
import { store } from "../../store";

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
  });

  it("should render SelectGroup options", async () => {
    store.dispatch({
      type: "group/setGroups",
      payload: [
        { id: 1, group_name: "Group A", userid: 517 },
        { id: 2, group_name: "Group B", userid: 517 },
      ],
    });
    renderWithProviders(<Groups />);

    const selectGroup = screen.getByTestId("select-group");
    expect(selectGroup).toBeInTheDocument();

    // SelectGroup.tsx has two SingleSelect components
    // SingleSelect takes in an id that is appended to the data-testid
    const groupSelect = screen.getByTestId("single-select-1");
    expect(groupSelect).toBeInTheDocument();

    // handle the group select dropdown
    const trigger = screen.getByTestId("single-select-trigger-icon-1");
    expect(trigger).toBeInTheDocument();

    // When checking the options, make sure we have the correct SingleSelect component
    const firstGroup = screen.getByTestId("single-select-option-1-0");
    expect(firstGroup).toBeInTheDocument();
    expect(firstGroup).toHaveTextContent("Group A");

    // Should handle group selection
    await user.click(firstGroup);
    await waitFor(() => {
      const state = store.getState();
      expect(state.group.createInput).toEqual("Group A");
      expect(state.group.selectedGroup).toEqual({
        id: 1,
        group_name: "Group A",
        userid: 517,
      });
    });
  });

  it("should render Filter Options and handle selection", async () => {
    renderWithProviders(<Groups />);

    // in SelectGroup.tsx, the second SingleSelect is for filter options
    const selectGroup = screen.getByTestId("select-group");
    expect(selectGroup).toBeInTheDocument();

    const filterSelect = screen.getByTestId("single-select-2");
    expect(filterSelect).toBeInTheDocument();

    const trigger = screen.getByTestId("single-select-trigger-icon-2");
    expect(trigger).toBeInTheDocument();

    const activeOption = screen.getByTestId("single-select-option-2-1");
    expect(activeOption).toBeInTheDocument();
    expect(activeOption).toHaveTextContent("Active Stores");

    // Should handle option selection
    await user.click(activeOption);

    await waitFor(() => {
      const state = store.getState();
      expect(state.group.filterOption).toEqual("active");
    });
  });

  it("should render modal if deleting an existing group", async () => {
    store.dispatch({
      type: "group/setGroups",
      payload: [
        { id: 1, group_name: "Group A", userid: 517 },
        { id: 2, group_name: "Group B", userid: 517 },
      ],
    });

    // just checking if the Groups page renders correctly
    renderWithProviders(<Groups />);
    const createGroup = screen.getByTestId("create-group");
    const groupSelect = screen.getByTestId("single-select-1");
    const trigger = screen.getByTestId("single-select-trigger-icon-1");
    expect(createGroup).toBeInTheDocument();
    expect(groupSelect).toBeInTheDocument();
    expect(trigger).toBeInTheDocument();

    await user.click(trigger);

    const secondGroup = screen.getByTestId("single-select-option-1-1");
    expect(secondGroup).toBeInTheDocument();
    expect(secondGroup).toHaveTextContent("Group B");

    await user.click(secondGroup);

    await waitFor(() => {
      const state = store.getState();
      expect(state.group.createInput).toEqual("Group B");
      expect(state.group.selectedGroup).toEqual({
        id: 2,
        group_name: "Group B",
        userid: 517,
      });
    });

    const deleteBtn = screen.getByTestId("group-delete-btn");
    expect(deleteBtn).toBeInTheDocument();
    await user.click(deleteBtn);

    const modal = await screen.findByTestId("modal");
    expect(modal).toBeInTheDocument();
  });

  it("should not open modal if deleting a non-existing group", async () => {
    store.dispatch({
      type: "group/setGroups",
      payload: [
        { id: 1, group_name: "Group A", userid: 517 },
        { id: 2, group_name: "Group B", userid: 517 },
      ],
    });
    renderWithProviders(<Groups />);

    const createGroup = screen.getByTestId("create-group");
    expect(createGroup).toBeInTheDocument();

    const input = screen.getByTestId("create-group-input");
    await user.type(input, "NonExistingGroup");

    const deleteBtn = screen.getByTestId("group-delete-btn");
    expect(deleteBtn).toBeInTheDocument();
    await user.click(deleteBtn);

    await waitFor(() => {
      const modal = screen.queryByTestId("modal");
      expect(modal).not.toBeInTheDocument();
    });
  });
});
