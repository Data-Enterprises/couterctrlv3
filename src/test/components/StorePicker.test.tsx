import StorePicker from "../../components/storePicker/StorePicker";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../utils";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { mockStore as store } from "../mockStore";

describe("StorePicker Component", () => {
  it("should render StorePicker component with all children", () => {
    renderWithProviders(<StorePicker />);

    const storePicker = screen.getByTestId("store-picker");
    expect(storePicker).toBeInTheDocument();

    const state = store.getState().search.type;
    if (
      state === "1" ||
      state === "Stores" ||
      state === "Single Store" ||
      state === "3"
    ) {
      const searchStore = screen.getByTestId("search-store");
      expect(searchStore).toBeInTheDocument();
    } else if (state === "Group" || state === "2") {
      const selectGroup = screen.getByTestId("select-group");
      expect(selectGroup).toBeInTheDocument();
    }
  });

  it("should render SearchStore when selecting Stores or Single Store", async () => {
    renderWithProviders(<StorePicker />);
    const storePicker = screen.getByTestId("store-picker");
    expect(storePicker).toBeInTheDocument();

    // passing but not finished, click on Stores or Single Store and render Search Store
  });

  it("should render SelectGroup when selecting Stores or Single Store", async () => {
    renderWithProviders(<StorePicker />);
    const storePicker = screen.getByTestId("store-picker");
    expect(storePicker).toBeInTheDocument();

    // passing but not finished, click on Stores or Single Store and render Search Store
  });
});
