// Utils
import {
  applyStoreNumberToName,
  numbersByStoreId,
} from "../../../../../utils/storeIdentity";
import { sumCouponAmount } from "../../../../../utils/couponValue";

// Interfaces
import type { CouponItem } from "../../../../../interfaces";
import type { StoreItem } from "../interfaces";

/**
 * The store list: one row per location with its coupon count and value,
 * sorted by value or count. Keyed on storeid + store_number, not storeid
 * alone — a few storeids cover two physical locations. See utils/storeIdentity.
 */
export const buildStoreItems = (
  coupons: CouponItem[],
  assignedStores: { storeid: number; store_name: string }[],
  groupStores: { storeid: number; store_name: string }[],
  storeName: string | undefined,
  sortMetric: "amount" | "qty",
): StoreItem[] => {
  const numbersById = numbersByStoreId(
    coupons,
    (c) => c.storeid,
    (c) => c.store_number,
  );
  // Collected per store, then totalled with sumCouponAmount: a running add
  // can't dedupe the transaction-level fallback (see utils/couponValue).
  const map = new Map<string, { name: string; rows: CouponItem[] }>();
  coupons.forEach((c) => {
    const id = `${c.storeid}__${c.store_number}`;
    const cur = map.get(id);
    if (cur) {
      cur.rows.push(c);
      return;
    }
    map.set(id, {
      name: applyStoreNumberToName(
        assignedStores.find((s) => s.storeid === Number(c.storeid))
          ?.store_name ??
          groupStores.find((s) => s.storeid === Number(c.storeid))
            ?.store_name ??
          storeName ??
          String(c.storeid),
        c.store_number,
        numbersById[c.storeid] ?? [],
      ),
      rows: [c],
    });
  });
  return Array.from(map.entries())
    .map(([id, { name, rows }]) => ({
      key: id,
      label: name,
      count: rows.length,
      total: sumCouponAmount(rows),
    }))
    .sort((a, b) =>
      sortMetric === "qty" ? b.count - a.count : b.total - a.total,
    );
};
