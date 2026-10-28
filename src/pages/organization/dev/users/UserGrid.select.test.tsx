import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { setupStore } from "../../../../store";
import type { User } from "../../../../interfaces";
import UserGrid from "./UserGrid";

vi.mock("../../../../components/toasts/hooks/useToast", () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn(), warn: vi.fn() }),
}));

const person = (id: number, username: string, level = 2): User =>
  ({
    id,
    username,
    user_level: level,
    last_visit: null,
    join_date: null,
    first_name: `First ${username}`,
    last_name: "Test",
    email: `${username}@example.test`,
    companies: [],
    company: 1,
    active: 1,
    template: null,
    security: null,
    role: 2,
    password_change_needed: 0,
    logged_in: null,
    access_mode: "all",
  }) as User;

const store = setupStore();
const ctx = {
  dispatch: store.dispatch,
  url: "",
  token: "",
  userid: 1,
  userLevel: 7,
  userLevels: [
    { id: 2, name: "User" },
    { id: 7, name: "Owner" },
    { id: 9, name: "Programmer" },
  ],
  // Me, two people I can pick, and one above me I cannot.
  users: [person(1, "me", 7), person(2, "amy"), person(3, "ben"), person(4, "boss", 9)],
  inactiveUsers: [] as User[],
  usersExportOpen: false,
  usersGridFilters: {
    companyFilter: "",
    statusFilter: "",
    levelFilter: "",
    roleFilter: "",
    accessFilter: "",
    searchText: "",
    usernameFilter: "",
    emailFilter: "",
  },
};
vi.mock("../hooks", () => ({ useOrganizationCtx: () => ctx }));

const show = () =>
  render(
    <Provider store={store}>
      <UserGrid onOpenCreate={vi.fn()} />
    </Provider>,
  );

const row = (username: string) =>
  screen.getByText(username, { selector: "div.truncate" }).parentElement!;

describe("picking users to deactivate", () => {
  it("shows no checkboxes until the action is chosen", () => {
    show();
    expect(screen.queryAllByRole("checkbox")).toHaveLength(0);
    expect(screen.getByRole("button", { name: /Deactivate users/ })).toBeTruthy();
  });

  it("says what the boxes are for before anything is ticked", async () => {
    show();
    await userEvent.click(screen.getByRole("button", { name: /Deactivate users/ }));
    expect(screen.getByText("Choose who to deactivate")).toBeTruthy();
    expect(screen.getByText("0 of 2 picked")).toBeTruthy();
    // Only amy and ben: not me, and not someone above my level.
    expect(screen.getAllByRole("checkbox")).toHaveLength(2);
    const go = screen.getByRole("button", { name: "Deactivate 0" });
    expect((go as HTMLButtonElement).disabled).toBe(true);
  });

  it("ticks a row from anywhere on it, and all shown from the bar", async () => {
    show();
    await userEvent.click(screen.getByRole("button", { name: /Deactivate users/ }));
    await userEvent.click(row("amy"));
    expect(screen.getByText("1 of 2 picked")).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: "Select all 2 shown" }));
    expect(screen.getByText("2 of 2 picked")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Deactivate 2" })).toBeTruthy();
  });

  it("hides the row actions while picking, and Cancel puts it all back", async () => {
    show();
    expect(within(row("amy")).getByTitle("Deactivate")).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: /Deactivate users/ }));
    expect(within(row("amy")).queryByTitle("Deactivate")).toBeNull();
    expect(within(row("amy")).queryByTitle("Edit")).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByText("Choose who to deactivate")).toBeNull();
    expect(screen.queryAllByRole("checkbox")).toHaveLength(0);
    expect(within(row("amy")).getByTitle("Deactivate")).toBeTruthy();
  });

  it("backs out on Escape", async () => {
    show();
    await userEvent.click(screen.getByRole("button", { name: /Deactivate users/ }));
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByText("Choose who to deactivate")).toBeNull();
  });
});
