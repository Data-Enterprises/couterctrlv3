// Interfaces
import type { EventSort } from "../../../../../features/dev/devEventPerfSlice";
import type { SortOption } from "../../../../../components-dev/mobile/interfaces";

export const fmtInt = (n: number) => Math.round(n).toLocaleString("en-US");

/** What the store and cashier lists can sort by. The page's own figure leads,
 *  so the chip row opens on the order the list is already in. */
export const sortOptions = (
  measure: "transactions" | "amount",
  by: "store" | "cashier",
): SortOption<EventSort>[] => {
  const size: SortOption<EventSort>[] = [
    { key: "transactions", label: "Transactions" },
    { key: "amount", label: "Amount" },
  ];
  return [
    ...(measure === "amount" ? size.reverse() : size),
    { key: "change", label: "vs Avg" },
    // Store number only. It is an identifier, and running down the stores in
    // order is a real way to read the list; sorting cashiers or lanes
    // alphabetically is not, so those lose the chip.
    ...(by === "store"
      ? [{ key: "name" as const, label: "Store #" }]
      : []),
  ];
};

/** A day as the header and the list name it, e.g. "Tue 11/4". */
export const shortDay = (iso: string | null) =>
  iso
    ? new Date(`${iso}T12:00:00`).toLocaleDateString("en-US", {
        weekday: "short",
        month: "numeric",
        day: "numeric",
      })
    : "";
