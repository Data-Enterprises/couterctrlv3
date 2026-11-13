import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { setupStore } from "@/store";
import { setSearchValue } from "@/features/dev/devSubMarginSlice";
import SmDevEntryCard from "@/pages/subDepts/dev/components/SmDevEntryCard";

/*
 * The page's search takes an optional location: given one, it is a refetch that
 * keeps the week already searched. A first search from the card must pass
 * nothing, or the week it searched is never recorded.
 */

describe("Sub Dept Margins' search card", () => {
  it("starts a fresh search, with no argument", () => {
    const store = setupStore();
    store.dispatch(setSearchValue(36));
    const onSearch = vi.fn();
    render(
      <Provider store={store}>
        <SmDevEntryCard onSearch={onSearch} />
      </Provider>,
    );
    fireEvent.click(screen.getByRole("button", { name: /^search$/i }));
    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenCalledWith();
  });
});
