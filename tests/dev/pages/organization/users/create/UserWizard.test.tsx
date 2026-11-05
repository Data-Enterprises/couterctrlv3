import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { setupStore } from "@/store";
import {
  setDuplicateSource,
  type DuplicateSource,
} from "@/features/dev/devUsersSlice";
import UserWizard from "@/pages/organization/dev/users/create/UserWizard";
import Stepper from "@/pages/organization/dev/users/create/Stepper";

vi.mock("@/components/toasts/hooks/useToast", () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn(), warn: vi.fn(), info: vi.fn() }),
}));

const source: DuplicateSource = {
  role: 2,
  user_level: 5,
  companyIds: [1],
  baseGroupIds: [10],
  groups: [{ id: 10, name: "East", company: 1 }],
  mode: "all",
  stores: [],
};

const openAdd = (store = setupStore()) => {
  render(
    <Provider store={store}>
      <UserWizard onComplete={vi.fn()} onCancel={vi.fn()} />
    </Provider>,
  );
  return store;
};

describe("Add user after a Duplicate", () => {
  it("fills in from the source once, and lets it go", () => {
    const store = setupStore();
    store.dispatch(setDuplicateSource(source));
    openAdd(store);
    const users = store.getState().dev.users;
    expect(users.userInfo.role).toBe(2);
    expect(users.userInfo.user_level).toBe(5);
    // Cleared, so the next Add user opens blank.
    expect(users.duplicateSource).toBeNull();
  });

  it("opens blank when nothing was duplicated", () => {
    const store = openAdd();
    expect(store.getState().dev.users.userInfo.role).toBe(0);
  });
});

describe("the step bar", () => {
  const steps = () =>
    ["User info", "Access type", "Assignments", "Review"].map(
      (name) => screen.getByRole("button", { name: new RegExp(`${name}$`) }) as HTMLButtonElement,
    );

  it("stops at the first step that isn't ready, even one visited before", () => {
    render(<Stepper current="identity" furthest="review" limit={2} onGoTo={vi.fn()} />);
    expect(steps().map((b) => b.disabled)).toEqual([false, false, false, true]);
  });

  it("reaches every visited step when nothing is unready", () => {
    render(<Stepper current="identity" furthest="review" onGoTo={vi.fn()} />);
    expect(steps().map((b) => b.disabled)).toEqual([false, false, false, false]);
  });
});

describe("Create user", () => {
  it("can't be reached from a blank form", () => {
    openAdd();
    const review = screen.getByRole("button", { name: /Review$/ }) as HTMLButtonElement;
    expect(review.disabled).toBe(true);
  });
});

describe("choosing Single Store", () => {
  const byStore: DuplicateSource = {
    ...source,
    role: 2,
    mode: "selected",
    stores: [301, 302, 303].map((id) => ({
      storeid: id,
      store_number: String(id),
      store_name: `Store ${id}`,
      company: 1,
      company_name: "Houchens",
      base_group: 10,
    })),
  };

  it("says what it trimmed, and the role back takes the note away", async () => {
    const store = setupStore();
    store.dispatch(setDuplicateSource(byStore));
    openAdd(store);
    // Role is the first select on User info.
    const select = document.querySelector("select") as HTMLSelectElement;
    await userEvent.selectOptions(select, "1");
    expect(screen.getByRole("status").textContent).toMatch(
      /Single Store keeps only 301 · Store 301; the other 2 stores are unpicked/,
    );
    await userEvent.selectOptions(select, "2");
    expect(screen.queryByText(/Single Store keeps only/)).toBeNull();
  });
});

describe("leaving Add user", () => {
  const open = () => {
    const onCancel = vi.fn();
    const store = setupStore();
    render(
      <Provider store={store}>
        <UserWizard onComplete={vi.fn()} onCancel={onCancel} />
      </Provider>,
    );
    return { onCancel, store };
  };

  it("leaves straight away when nothing was filled in", async () => {
    const { onCancel } = open();
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalled();
  });

  it("asks first when something was, and tells the tab bar", async () => {
    const { onCancel, store } = open();
    const select = document.querySelector("select") as HTMLSelectElement;
    await userEvent.selectOptions(select, "2");
    expect(store.getState().dev.organization.unsavedWizard).toBe("the new user");
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).not.toHaveBeenCalled();
    expect(screen.getByText(/Discard your changes to the new user/)).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: "Discard" }));
    expect(onCancel).toHaveBeenCalled();
  });
});
