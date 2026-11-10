// Interfaces
import type { AllOrder } from "../../../../../../interfaces";
import type { OrderDraft, VendorOption } from "../../../interfaces";

/** An order's date as the panel prints it: m/d/yyyy. */
export const fmtOrderDate = (iso: string) => {
  const [y, m, d] = iso.split("T")[0].split("-");
  return `${+m}/${+d}/${y}`;
};

/** A store number padded to three digits. */
export const padStoreNumber = (n: string | number) => String(n).padStart(3, "0");

/**
 * The vendors already on this store's orders.
 *
 * `items/itemlookup` does not return a `vendor_id` and the column is
 * `NOT NULL`, so an added line asks for one — out of the vendors the store
 * really orders from, because an id the POS does not know is worse than no
 * line.
 */
export const storeVendors = (
  allOrders: AllOrder[],
  draft: OrderDraft | null,
): VendorOption[] => {
  if (!draft) return [];
  const seen = new Map<string, string>();
  for (const o of allOrders) {
    if (o.storeid !== draft.doc.storeid || !o.vendor_id) continue;
    if (!seen.has(o.vendor_id)) seen.set(o.vendor_id, o.vendor_name ?? o.vendor_id);
  }
  // By name, which is what the column and the picker show — an id is how
  // the row stores a vendor, not how anybody looks one up.
  return [...seen.entries()]
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name));
};
