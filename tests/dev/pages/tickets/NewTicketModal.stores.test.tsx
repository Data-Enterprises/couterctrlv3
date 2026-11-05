import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { setupStore } from "@/store";
import type { TicketsCtx } from "@/pages/tickets/dev/hooks";
import NewTicketModal from "@/pages/tickets/dev/NewTicketModal";

const storeOptions = vi.fn();
vi.mock("@/api/tickets", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/api/tickets")>()),
  getTicketStoreOptions: (...args: unknown[]) => storeOptions(...args),
}));

const ctxFor = (isTech: boolean, store: ReturnType<typeof setupStore>) =>
  ({
    isTech,
    userid: 1,
    lookups: null,
    dispatch: store.dispatch,
    file: vi.fn(),
    working: false,
  }) as unknown as TicketsCtx;

const show = (isTech: boolean) => {
  const store = setupStore();
  render(
    <Provider store={store}>
      <NewTicketModal ctx={ctxFor(isTech, store)} />
    </Provider>,
  );
};

describe("the stores a new ticket can be about", () => {
  beforeEach(() => {
    storeOptions.mockReset();
    storeOptions.mockResolvedValue({
      data: {
        error: 0,
        success: true,
        stores: [
          { storeid: 301, store_number: "301", store_name: "301 - Food Giant Hayti", company: 4, company_name: "Food Giant", deactivated: false },
          { storeid: 782, store_number: "782", store_name: "782 - Crossroads", company: null, company_name: null, deactivated: false },
        ],
      },
    });
  });

  it("is every store for a tech, who files for a client who phoned in", async () => {
    show(true);
    expect(storeOptions).toHaveBeenCalledTimes(1);
    // Two companies, so each is a folded heading over its stores.
    expect(await screen.findByText(/Food Giant/)).toBeTruthy();
    expect(screen.getByText(/No company/)).toBeTruthy();
  });

  it("is someone's own stores otherwise, with no call", () => {
    show(false);
    expect(storeOptions).not.toHaveBeenCalled();
    expect(screen.getByText(/You have no stores of your own/)).toBeTruthy();
  });
});
