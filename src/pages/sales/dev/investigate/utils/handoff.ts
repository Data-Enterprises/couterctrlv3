// Utils
import { CAUSE_LABEL } from "./deptInvestigation";

// Interfaces
import type { Cause, HandoffList, HandoffOwner } from "../interfaces";
import type { Desk } from "./investigationSteps";

/** The lists in the order they are handed out; nobody's comes last. */
export const HANDOFF_ORDER: HandoffOwner[] = ["buyer", "receiving", "price", null];

/** Who a list is for, as a row says it. */
export const HANDOFF_NAME: Record<string, string> = {
  buyer: "Buyer",
  receiving: "Receiving",
  price: "Whoever sets price",
  none: "Not handed to anyone",
};

/** The same, short enough for a tab. */
export const HANDOFF_TAB: Record<string, string> = {
  buyer: "Buyer",
  receiving: "Receiving",
  price: "Price",
  none: "Not handed",
};

/** A list's item columns: #, item, (cause,) UPC, difference. Literal for Tailwind. */
export const HANDOFF_COLS = {
  oneCause: "grid-cols-[26px_minmax(0,1fr)_120px_96px]",
  withCause: "grid-cols-[26px_minmax(0,1fr)_128px_120px_96px]",
};

/** The key a list is filed under: its owner, or "none". */
export const handoffKey = (owner: HandoffOwner) => owner ?? "none";

/**
 * The desks grouped by the person they go to: one list per person, holding
 * all of that person's causes, biggest first. Lists with nothing in them are
 * left out, so every row on the tab has work behind it.
 */
export const handoffOf = (desks: Desk[]): HandoffList[] =>
  HANDOFF_ORDER.map((owner) => {
    const mine = desks
      .filter((d) => d.owner === owner)
      .sort((a, b) => a.dollars - b.dollars);
    return {
      owner,
      desks: mine,
      items: mine.flatMap((d) => d.items),
      total: mine.reduce((t, d) => t + d.dollars, 0),
    };
  }).filter((l) => l.items.length > 0);

/** How a cause reads inside a list's headline. */
const PHRASE: Partial<Record<Cause, (us: string, them: string) => string>> = {
  "never-ordered": (us) => `never ordered at ${us}`,
  "not-carried": (us) => `not carried at ${us}`,
  "not-received": (us) => `ordered at ${us}, with no receiver on file since the order`,
  cost: (us, them) => `bought for more at ${us} than at ${them}`,
  "price-mix": (us, them) => `${us} took less a unit than ${them}, and price is most of the gap`,
};

/** Why a cause goes on nobody's list, said under its section line. */
export const NOBODY_WHY: Partial<Record<Cause, (us: string, them: string) => string>> = {
  "not-moving": (us) =>
    `Both stores sold these at about the same price and ${us} sold fewer. No record names who could fix that.`,
  streamlined: (_us, them) => `Within $5 of ${them}. Nothing to chase.`,
  unsold: (us) => `Delivered to ${us} and none of it rang. Nothing on record says why.`,
  "no-receipts": () =>
    "The receivers couldn't be read, so nothing says whether these were delivered.",
};

/** The headline over one person's list. */
export const handoffSays = (
  list: HandoffList,
  us: string,
  them: string,
  fmt: (v: number) => string,
): string => {
  const k = list.items.length;
  const n = `${k.toLocaleString("en-US")} ${k === 1 ? "item" : "items"}`;
  const worth = `${list.total < 0 ? "−" : ""}${fmt(Math.abs(list.total))}`;
  if (list.owner === null)
    return `${n} no list can fix, worth ${worth}. Each section says why.`;
  const who =
    list.owner === "buyer" ? "the buyer" : list.owner === "price" ? "whoever sets price" : "receiving";
  const lead = list.desks[0];
  const phrase = PHRASE[lead.cause]?.(us, them) ?? CAUSE_LABEL[lead.cause].toLowerCase();
  const mostly =
    list.desks.length > 1 && Math.abs(lead.dollars) >= (Math.abs(list.total) * 2) / 3
      ? "mostly "
      : "";
  return `${n} for ${who}, worth ${worth}: ${mostly}${phrase}.`;
};

/** The tab's headline: how much of the shortfall has someone to hand it to. */
export const handoffLead = (lists: HandoffList[]) => {
  const owned = lists.filter((l) => l.owner !== null);
  const total = lists.reduce((t, l) => t + l.total, 0);
  const ownedTotal = owned.reduce((t, l) => t + l.total, 0);
  const k = owned.length;
  const says =
    k === 0
      ? "Nothing here names anyone to hand it to."
      : Math.abs(ownedTotal) >= Math.abs(total) / 2
        ? `Most of the shortfall has someone to hand it to: ${k === 1 ? "one list" : `${k} lists`}, one for each desk.`
        : `Most of the shortfall has no one to hand it to. ${k === 1 ? "One list goes" : `${k} lists go`} to a desk.`;
  return { says, total, ownedTotal, rest: total - ownedTotal };
};
