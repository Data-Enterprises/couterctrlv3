// Interfaces
import type {
  Ticket,
  TicketScope,
  TicketStore,
  TicketStoreOption,
} from "../../../../api/tickets";
import type { Store } from "../../../../interfaces";
import type { StoreCompanyGroup } from "../interfaces";

/**
 * The stores a ticket is about, and who that lets see it.
 *
 * A ticket carries a list of stores (`ticket_store_link`), and the server
 * scopes the queue by them: below Manager sees what they opened, a Manager also
 * sees tickets naming one of their stores, an Owner also sees their companies'
 * tickets. Empty means "Not about a store", which is an answer, not a gap.
 *
 * Every rule lives server-side. These are only the pieces the screens need to
 * draw the answer and to ask the question without offering a store the server
 * would refuse.
 */

/** A ticket's stores, safe before the API sends them. */
export const storesOf = (ticket: Ticket): TicketStore[] => ticket.stores ?? [];

/**
 * The compact form for a queue row: `#54 · #75 · +3`.
 *
 * Numbers, not names: the row has room for a chip, and a store number is how
 * people say which store. Three and then a count, so one ticket about a whole
 * group does not wrap the row.
 */
export const storeChipText = (stores: TicketStore[], shown = 3): string => {
  if (stores.length === 0) return "";
  const head = stores.slice(0, shown).map((s) => `#${s.store_number}`);
  const rest = stores.length - shown;
  return rest > 0 ? [...head, `+${rest}`].join(" · ") : head.join(" · ");
};

/** The full form, for the ticket's own header. */
export const storeFullText = (stores: TicketStore[]): string =>
  stores.length === 0
    ? "Not about a store"
    : stores.map((s) => `#${s.store_number} ${s.store_name}`).join(", ");

/**
 * What the inbox is showing, in words.
 *
 * Read from the server's `scope`, never derived from a level: a manager who
 * does not see a coworker's ticket should be told why by the page, not left
 * to wonder whether it was filed.
 */
export const SCOPE_TEXT: Record<TicketScope, string> = {
  own: "Tickets you opened.",
  stores:
    "Tickets you opened, tickets about your stores, and tickets your stores' staff filed without a store.",
  company: "Tickets you opened, and every ticket for your companies.",
  all: "Every ticket.",
};

/** The inbox heading for someone off the desk. */
export const SCOPE_HEADING: Record<TicketScope, string> = {
  own: "Your tickets",
  stores: "Your stores' tickets",
  company: "Your companies' tickets",
  all: "Queue",
};

/** Store numbers sort as numbers: 2, 5, 27, 136 rather than 136, 2, 27.
 *  A store with no number sorts first rather than throwing. */
const byNumber = (a: { store_number: string }, b: { store_number: string }) => {
  const na = a.store_number ?? "";
  const nb = b.store_number ?? "";
  return (parseInt(na, 10) || 0) - (parseInt(nb, 10) || 0) || na.localeCompare(nb);
};

/**
 * The signed-in person's own stores, as the New Ticket picker's options.
 *
 * Their `assigned` stores, which the app already holds from sign-in
 * (`user.assignedStores`), so filing a ticket costs no store call. It is the
 * same set the server files against: `_has_store` in tickets.py is a row in
 * `assigned`, and `assigned_stores` is read from it too. A tech's
 * `store_options` was every store on the system (423); this is only theirs.
 */
export const assignedAsOptions = (stores: Store[]): TicketStoreOption[] =>
  cleanStoreOptions(
    stores.map((s) => ({
      storeid: s.storeid,
      store_number: s.store_number,
      store_name: s.store_name,
      company: s.company ?? null,
      company_name: s.company_name,
      deactivated: Boolean(s.deactivated_at),
      selected: false,
    })),
  );

/**
 * The server's options with every text field a string.
 *
 * `store_options` left-joins companies, so a store with no company comes
 * back with `company` and `company_name` null, and nothing in the table stops a
 * store's number or name being null. The picker sorts and searches on all
 * three, and one null among a tech's every-store list took the whole page
 * down ("Cannot read properties of null (reading 'localeCompare')").
 */
export const cleanStoreOptions = (
  raw: TicketStoreOption[],
): TicketStoreOption[] =>
  raw.map((o) => ({
    ...o,
    store_number: String(o.store_number ?? ""),
    store_name: o.store_name ?? "",
    company_name: o.company_name ?? "",
  }));

/**
 * The picker's list, a block per company.
 *
 * Grouped because a DCR user, a Houchens user and a tech all hold stores in
 * several companies, and two companies can both have a store 5. Closed stores
 * go last within their company: they can still be picked, since a ticket can
 * be about one, but they are rarely the one meant.
 */
export const groupByCompany = (
  options: TicketStoreOption[],
): StoreCompanyGroup[] => {
  const groups = new Map<number | null, StoreCompanyGroup>();
  for (const o of options) {
    const g = groups.get(o.company) ?? {
      company: o.company,
      company_name: o.company_name,
      stores: [],
    };
    g.stores.push(o);
    groups.set(o.company, g);
  }
  return [...groups.values()]
    .map((g) => ({
      ...g,
      stores: [...g.stores].sort(
        (a, b) => Number(a.deactivated) - Number(b.deactivated) || byNumber(a, b),
      ),
    }))
    // Stores with no company go last, as the server orders them.
    .sort(
      (a, b) =>
        Number(!a.company_name) - Number(!b.company_name) ||
        a.company_name.localeCompare(b.company_name),
    );
};

/** Whether a store answers what was typed in the picker's search box. */
export const matchesStoreQuery = (o: TicketStoreOption, query: string) => {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    o.store_number.toLowerCase().includes(q.replace(/^#/, "")) ||
    o.store_name.toLowerCase().includes(q) ||
    o.company_name.toLowerCase().includes(q)
  );
};

/**
 * What the picker starts with.
 *
 * Only stores the person can actually file against: a shared group is
 * search-only, so the store a page was searching can be one that is not in
 * their `assigned` and the server would answer 400. Pre-ticking it would make
 * the form's own default the thing that fails.
 *
 * - A store search ticks that store, if it is one of theirs.
 * - Someone with exactly one store, who is not a tech, gets it ticked and is
 *   not asked (`ask: false`).
 * - Everything else starts with nothing ticked.
 */
export const initialStorePicks = ({
  options,
  isTech,
  searchedStoreId,
}: {
  options: TicketStoreOption[];
  isTech: boolean;
  searchedStoreId: number | null;
}): { picked: number[]; ask: boolean } => {
  if (!isTech && options.length === 1) {
    return { picked: [options[0].storeid], ask: false };
  }
  const searched =
    searchedStoreId !== null &&
    options.some((o) => o.storeid === searchedStoreId)
      ? [searchedStoreId]
      : [];
  return { picked: searched, ask: true };
};

/**
 * Which options to list first, for a ticket filed from a group search.
 *
 * The group's stores that are also theirs. A shared group can hold none of
 * their stores at all, and then the list falls back to all of them rather
 * than offering an empty box.
 */
export const optionsForGroup = (
  options: TicketStoreOption[],
  groupStoreIds: number[],
): TicketStoreOption[] => {
  if (groupStoreIds.length === 0) return options;
  const inGroup = new Set(groupStoreIds);
  const mine = options.filter((o) => inGroup.has(o.storeid));
  return mine.length ? mine : options;
};

/**
 * Every store that appears on the tickets in hand, for the queue's store
 * filter. Read off the rows, so the filter costs no call and never offers a
 * store with nothing behind it.
 */
export const storesOnTickets = (tickets: Ticket[]): TicketStore[] => {
  const seen = new Map<number, TicketStore>();
  for (const t of tickets) {
    for (const s of storesOf(t)) seen.set(s.storeid, s);
  }
  return [...seen.values()].sort(byNumber);
};
