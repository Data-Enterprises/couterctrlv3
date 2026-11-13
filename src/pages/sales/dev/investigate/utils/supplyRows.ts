// Utils
import { onDay } from ".";

// Interfaces
import type { SupplyKind, SupplyRow } from "../interfaces";
import type { Supply } from "./investigationSteps";

/** The Supply tab's rows, in the order they are listed. */
export const SUPPLY_ORDER: SupplyKind[] = [
  "ordersMine",
  "ordersTheirs",
  "receiptsMine",
  "receiptsTheirs",
];

/** A document list's columns, with or without the store dot. Literal, so
 *  Tailwind emits them. */
export const DOC_COLS = {
  withStore: "grid-cols-[62px_16px_minmax(0,1fr)_88px_minmax(0,110px)_62px_76px]",
  oneStore: "grid-cols-[62px_minmax(0,1fr)_88px_minmax(0,110px)_62px_76px]",
};

/** An opened document's line columns: orders carry no cost, receipts do. */
export const DOC_LINE_COLS = {
  order: "grid-cols-[120px_minmax(0,1fr)_70px]",
  receipt: "grid-cols-[120px_minmax(0,1fr)_70px_90px]",
};

/** Every row with its store's documents, newest first. */
export const supplyRowsOf = (supply: Supply): SupplyRow[] =>
  SUPPLY_ORDER.map((kind) => {
    const mine = kind === "ordersMine" || kind === "receiptsMine";
    const isOrder = kind === "ordersMine" || kind === "ordersTheirs";
    const side = mine ? supply.mine : supply.theirs;
    return {
      kind,
      mine,
      isOrder,
      docs: (isOrder ? supply.orders : supply.deliveries).filter((d) => d.mine === mine),
      units: isOrder ? side.orderedUnits : side.receivedUnits,
      cost: isOrder ? 0 : side.receivedCost,
    };
  });

/** A row's label in two parts, so the store can carry its colour dot. */
export const supplyLabel = (row: SupplyRow, us: string, them: string) => ({
  pre: row.isOrder ? "Ordered at" : "Received at",
  store: row.mine ? us : them,
});

/** A row's tab on the documents card. */
export const supplyTab = (row: SupplyRow, us: string, them: string) =>
  `${row.mine ? us : them} ${row.isOrder ? "orders" : "receivers"}`;

const many = (n: number, one: string) =>
  `${n.toLocaleString("en-US")} ${one}${n === 1 ? "" : "s"}`;
const whole = (v: number) => Math.round(v).toLocaleString("en-US");

/**
 * The headline over a row's documents. Says only what is on record: an
 * order with nothing received against it is "no receiver on file", never
 * late, and receipts that could not be read are said to be unread.
 */
export const supplySlideSays = (
  row: SupplyRow,
  store: string,
  /** That store's receipts in the window, for the orders headline. */
  received: number,
  ordersOk: boolean,
  receiptsOk: boolean,
  cash: (v: number) => string,
): string => {
  const n = row.docs.length;
  if (row.isOrder) {
    if (!ordersOk) return "The orders couldn't be read this time.";
    if (n === 0) return `No orders at ${store} in this department in the window.`;
    const states = [...new Set(row.docs.map((d) => d.status).filter(Boolean))];
    const all =
      states.length === 1
        ? `, ${n === 1 ? "still" : "all still"} ${String(states[0]).toLowerCase()}`
        : "";
    const none = received === 0 && receiptsOk ? ", and no receiver on file against them" : "";
    const biggest = [...row.docs].sort((a, b) => b.units - a.units)[0];
    const carries =
      // Three or more: of two orders, one always holds half.
      n > 2 && row.units > 0 && biggest.units >= row.units / 2
        ? ` One of them, #${biggest.id}, is ${whole(biggest.units)} of the ${whole(row.units)} units.`
        : "";
    return `${many(n, "order")} at ${store}${all}${none}.${carries}`;
  }
  if (!receiptsOk) return "We couldn't get the receiver information at this time.";
  if (n === 0) return `No receiver on file at ${store} in the window.`;
  return `${many(n, "receiver")} at ${store}: ${whole(row.units)} units, ${cash(row.cost)}.`;
};

/** What an empty receipts slide says beneath its headline. */
export const noReceiptsNote = (store: string, window: { start: string; end: string }) =>
  `Nothing was received at ${store} for this department between ${onDay(window.start)} and ${onDay(window.end)}. If deliveries came in, their receivers may not be entered yet.`;
