import StorePicker from "../../components/storePicker/StorePicker";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../utils";
import { describe, expect, it } from "vitest";
import { store } from "../../store";

describe("StorePicker Component", () => {
  it("should render StorePicker component with all children", () => {
    renderWithProviders(<StorePicker />);

    const storePicker = screen.getByTestId("store-picker");
    expect(storePicker).toBeInTheDocument();

    const state = store.getState().search.type;
    if (state === "Stores" || state === "Store") {
      const searchStore = screen.getByTestId("search-store");
      expect(searchStore).toBeInTheDocument();
    } else if (state === "Group") {
      const selectGroup = screen.getByTestId("select-group");
      expect(selectGroup).toBeInTheDocument();
    }
  });
});
