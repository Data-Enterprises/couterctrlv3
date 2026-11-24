import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { setupStore } from "@/store";
import { setAssignedStores } from "@/features/userSlice";
import { setNoReceivers, setStoreId } from "@/features/dev/devReceiversSlice";
import Receivers from "@/pages/receivers/dev/Receivers";
import type { Store } from "@/interfaces";

/*
 * "Search again" on the No receivers found card searches again with the store
 * and dates on screen, instead of clearing the card and the picked store.
 */

const list = vi.fn((..._args: unknown[]) => Promise.resolve({ data: { error: 0, recievers: [] } }));
vi.mock("@/api/receivers", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/api/receivers")>()),
  getReceiversList: (...args: unknown[]) => list(...args),
}));
vi.mock("@/components/toasts/hooks/useToast", () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn(), warn: vi.fn() }),
}));

describe("Receivers' No receivers found card", () => {
  it("searches again with the picked store, and keeps it", async () => {
    const store = setupStore();
    store.dispatch(setAssignedStores([{ storeid: 36, store_number: "36", store_name: "Chapel Hill" }] as Store[]));
    store.dispatch(setStoreId(36));
    store.dispatch(setNoReceivers(true));
    render(
      <Provider store={store}>
        <Receivers />
      </Provider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Search again" }));

    await waitFor(() => expect(list).toHaveBeenCalled());
    expect(list.mock.calls[0][2]).toBe(36);
    expect(store.getState().dev.receivers.storeid).toBe(36);
  });
});
