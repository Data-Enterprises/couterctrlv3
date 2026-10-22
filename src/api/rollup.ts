import axios from "axios";

/**
 * One vendor's or one department's totals, for one store location on one day.
 *
 * `POST /subs/rollup` (backend 22 Oct): the item rows `subs/subs` returns,
 * summed by key on the server, so a list of thirty vendors costs ~40 KB rather
 * than every item row in the store (13 MB for one store-week). The sums are
 * built from the same rows `subs/subs` serves, costed per row the way
 * `calculateCogs` does, so a vendor here equals its items there to the cent.
 */
export interface RollupRow {
  /** Vendor id or sub-department number, as text. No vendor is "", no
   *  sub-department is "0". */
  key: string;
  name: string;
  storeid: number;
  /** One storeid can be two shops (685 is 369 and 370), so rows split by this. */
  store_number: string;
  /** yyyy-mm-dd */
  sale_date: string;
  /** total_sales - total_tax, the basis every page compares on. */
  net_sales: number;
  cogs: number;
  qty: number;
  weight: number;
  item_count: number;
}

export interface RollupResp {
  error: number;
  success: boolean;
  by: "vendor" | "sub_department";
  store_count: number;
  count: number;
  rows: RollupRow[];
  msg?: string;
}

/** The `subs/subs` body plus `by`. Unpaged: a rollup comes back whole. */
export const getRollup = (
  url: string,
  token: string,
  body: {
    by: "vendor" | "sub_department";
    startDate: string;
    endDate: string;
    useGroups: number;
    singleStore: number;
    searchValue: number;
    /** Narrow to one department; omitted or 0 is every department. */
    sub_department?: number;
  },
) =>
  axios<RollupResp>({
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    url: url + "subs/rollup",
    data: body,
  });
