import { describe, expect, it } from "vitest";
import type { Ticket, TicketStoreOption } from "../../../api/tickets";
import reducer, {
  initialState,
  lostTicket,
} from "../../../features/dev/devTicketsSlice";
import {
  groupByCompany,
  initialStorePicks,
  matchesStoreQuery,
  optionsForGroup,
  storeChipText,
  storeFullText,
  storesOnTickets,
} from "./ticketStores";

const store = (n: string, id = Number(n) * 10) => ({
  storeid: id,
  store_number: n,
  store_name: `S&C Foods ${n}`,
});

const option = (
  n: string,
  over: Partial<TicketStoreOption> = {},
): TicketStoreOption => ({
  ...store(n),
  company: 15,
  company_name: "S&C Foods",
  deactivated: false,
  selected: false,
  ...over,
});

const ticket = (id: number, stores?: ReturnType<typeof store>[]) =>
  ({ id, stores }) as Ticket;

describe("how a ticket's stores read", () => {
  it("names up to three by number, then counts the rest", () => {
    expect(storeChipText([store("54"), store("75")])).toBe("#54 · #75");
    expect(
      storeChipText(["2", "5", "27", "136", "140"].map((n) => store(n))),
    ).toBe("#2 · #5 · #27 · +2");
  });

  it("draws nothing on a row with no stores", () => {
    expect(storeChipText([])).toBe("");
  });

  it("says Not about a store in full, rather than nothing", () => {
    expect(storeFullText([])).toBe("Not about a store");
    expect(storeFullText([store("54")])).toBe("#54 S&C Foods 54");
  });
});

describe("the picker's list", () => {
  it("groups by company, and puts closed stores last within one", () => {
    const groups = groupByCompany([
      option("27"),
      option("3", { deactivated: true }),
      option("5"),
      option("9", { company: 1, company_name: "Houchens" }),
    ]);
    expect(groups.map((g) => g.company_name)).toEqual([
      "Houchens",
      "S&C Foods",
    ]);
    // 5 before 27 as numbers, and the closed 3 after both.
    expect(groups[1].stores.map((s) => s.store_number)).toEqual([
      "5",
      "27",
      "3",
    ]);
  });

  it("finds a store by number, with or without the #, or by name", () => {
    expect(matchesStoreQuery(option("54"), "#54")).toBe(true);
    expect(matchesStoreQuery(option("54"), "54")).toBe(true);
    expect(matchesStoreQuery(option("54"), "foods 54")).toBe(true);
    expect(matchesStoreQuery(option("54"), "75")).toBe(false);
  });
});

describe("what the picker starts with", () => {
  const mine = [option("54"), option("75")];

  it("ticks the searched store when it is one of theirs", () => {
    expect(
      initialStorePicks({ options: mine, isTech: false, searchedStoreId: 540 }),
    ).toEqual({ picked: [540], ask: true });
  });

  it("does not tick a searched store they cannot file against", () => {
    // A shared group is search-only: the store on screen can be one the
    // server would refuse, so it must not be the form's default.
    expect(
      initialStorePicks({ options: mine, isTech: false, searchedStoreId: 999 }),
    ).toEqual({ picked: [], ask: true });
  });

  it("answers for someone with one store, and does not ask", () => {
    expect(
      initialStorePicks({
        options: [option("54")],
        isTech: false,
        searchedStoreId: null,
      }),
    ).toEqual({ picked: [540], ask: false });
  });

  it("still asks a tech, whatever the list holds", () => {
    expect(
      initialStorePicks({
        options: [option("54")],
        isTech: true,
        searchedStoreId: null,
      }).ask,
    ).toBe(true);
  });
});

describe("a group search", () => {
  const mine = [option("54"), option("75"), option("80")];

  it("lists the group's stores that are also theirs", () => {
    expect(
      optionsForGroup(mine, [540, 750, 9990]).map((o) => o.store_number),
    ).toEqual(["54", "75"]);
  });

  it("falls back to all of theirs when the group holds none of them", () => {
    expect(optionsForGroup(mine, [9990])).toHaveLength(3);
  });
});

describe("the queue's store filter", () => {
  it("offers each store on the tickets once, in number order", () => {
    const found = storesOnTickets([
      ticket(1, [store("75"), store("54")]),
      ticket(2, [store("54")]),
      ticket(3, []),
      ticket(4), // an API that sends no stores
    ]);
    expect(found.map((s) => s.store_number)).toEqual(["54", "75"]);
  });
});

describe("a ticket that leaves the reader's view", () => {
  const held = {
    ...initialState,
    tickets: [ticket(7, []), ticket(8, [])],
    pending: [ticket(7, []), ticket(8, [])],
    selectedId: 7,
    detail: ticket(7, []),
    lastCommentId: 40,
    working: true,
  };

  it("closes the pane, drops the row and says why", () => {
    const next = reducer(held, lostTicket(7));
    expect(next.selectedId).toBeNull();
    expect(next.detail).toBeNull();
    expect(next.tickets.map((t) => t.id)).toEqual([8]);
    expect(next.pending?.map((t) => t.id)).toEqual([8]);
    expect(next.working).toBe(false);
    expect(next.error).toBe("That ticket is no longer in your view.");
  });

  it("leaves the open ticket alone when another one is lost", () => {
    const next = reducer(held, lostTicket(8));
    expect(next.selectedId).toBe(7);
    expect(next.tickets.map((t) => t.id)).toEqual([7]);
  });
});
