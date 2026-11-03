import { describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { Provider } from "react-redux";
import { setupStore } from "../../../../../store";
import { setUserCompanyIds } from "../../../../../features/dev/devUsersSlice";
import { useHeldAccess } from "./useHeldAccess";

vi.mock("../../../../../components/toasts/hooks/useToast", () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn(), warn: vi.fn(), info: vi.fn() }),
}));

const ok = (data: object) => Promise.resolve({ data: { error: 0, ...data } });
vi.mock("../../../../../api/company", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../../../../api/company")>()),
  getCompaniesAssignedToUser: () =>
    ok({ companies: [{ company: 1 }, { company: 3 }] }),
}));
vi.mock("../../../../../api/team", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../../../../api/team")>()),
  getBaseGroupsAssignedToUser: () => ok({ active: [], inactive: [] }),
  getUserGroupPicks: () => ok({ data: [] }),
}));
vi.mock("../../../../../api/user", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../../../../api/user")>()),
  getUserStores: () => ok({ assigned_stores: [], unassigned_stores: [] }),
}));

describe("what Edit starts from", () => {
  it("takes the person's companies from the server, not the grid row", async () => {
    const store = setupStore();
    // The row was read before company 3 was added on the Companies tab.
    store.dispatch(setUserCompanyIds([1]));
    const wrapper = ({ children }: { children: ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    );
    renderHook(() => useHeldAccess(42), { wrapper });
    await waitFor(() =>
      expect(store.getState().dev.users.userCompanyIds).toEqual([1, 3]),
    );
  });
});
