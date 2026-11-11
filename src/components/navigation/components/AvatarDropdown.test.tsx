import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { Provider } from "react-redux";
import { setupStore } from "@/store";
import { setApiEnv } from "@/features/appSlice";
import { setUserLevel } from "@/features/userSlice";
import AvatarDropdown from "./AvatarDropdown";

/*
 * The avatar menu: everyone gets their name and Sign out; dev mode adds Report
 * an issue; level 7+ gets the Environment panel with Mode; level 9 adds View,
 * Release notes and Sign in as another user.
 */

const openMenu = (level: number, env: "dev" | "prod") => {
  const store = setupStore();
  store.dispatch(setApiEnv(env));
  store.dispatch(setUserLevel(level));
  const setSignInAsOpen = vi.fn();
  render(
    <Provider store={store}>
      <MemoryRouter>
        <AvatarDropdown setReleaseNotesOpen={vi.fn()} setSignInAsOpen={setSignInAsOpen} />
      </MemoryRouter>
    </Provider>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Account menu" }));
  return { store, setSignInAsOpen };
};

describe("AvatarDropdown", () => {
  it("gives a client in prod only their name and Sign out", () => {
    openMenu(5, "prod");
    expect(screen.getByTestId("signout-btn")).toBeTruthy();
    expect(screen.queryByText("Environment")).toBeNull();
    expect(screen.queryByText("Report an issue")).toBeNull();
    expect(screen.queryByText("Release notes")).toBeNull();
  });

  it("gives level 7 the Environment panel with Mode, not View or Sign in as", () => {
    openMenu(7, "prod");
    expect(screen.getByText("Environment")).toBeTruthy();
    expect(screen.getByText("Level 7")).toBeTruthy();
    expect(screen.getByRole("group", { name: "Mode" })).toBeTruthy();
    expect(screen.queryByRole("group", { name: "View" })).toBeNull();
    expect(screen.queryByText("Sign in as another user")).toBeNull();
  });

  it("gives level 9 in dev every item", () => {
    openMenu(9, "dev");
    for (const label of ["Release notes", "Report an issue", "Sign in as another user"])
      expect(screen.getByText(label)).toBeTruthy();
    expect(screen.getByRole("group", { name: "View" })).toBeTruthy();
    expect(screen.getByRole("group", { name: "Mode" })).toBeTruthy();
  });

  it("switches Mode without closing the menu", () => {
    const { store } = openMenu(9, "dev");
    fireEvent.click(screen.getByRole("button", { name: "Prod" }));
    expect(store.getState().app.apiEnv).toBe("prod");
    expect(screen.getByRole("menu", { name: "Account" })).toBeTruthy();
  });

  it("opens Sign in as another user and closes the menu", () => {
    const { setSignInAsOpen } = openMenu(9, "dev");
    fireEvent.click(screen.getByText("Sign in as another user"));
    expect(setSignInAsOpen).toHaveBeenCalledWith(true);
    expect(screen.queryByRole("menu", { name: "Account" })).toBeNull();
  });
});
