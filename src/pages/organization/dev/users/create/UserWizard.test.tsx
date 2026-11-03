import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { setupStore } from "../../../../../store";
import {
  setDuplicateSource,
  type DuplicateSource,
} from "../../../../../features/dev/devUsersSlice";
import UserWizard from "./UserWizard";
import Stepper from "./Stepper";

vi.mock("../../../../../components/toasts/hooks/useToast", () => ({
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
