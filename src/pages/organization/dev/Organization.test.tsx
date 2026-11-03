import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { setupStore } from "../../../store";
import Organization from "./Organization";

vi.mock("../../../components/toasts/hooks/useToast", () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn(), warn: vi.fn(), info: vi.fn() }),
}));

describe("User Management below level 5", () => {
  it("says there's no access, instead of falling over", () => {
    // A fresh store's signed-in user is level 0.
    render(
      <Provider store={setupStore()}>
        <Organization />
      </Provider>,
    );
    expect(screen.getByText("You don’t have access to User Management.")).toBeTruthy();
  });
});
