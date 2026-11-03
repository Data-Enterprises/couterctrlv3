import type { SubDeptMargin } from "../../../../../interfaces";
import { countedRows } from "../../../../../utils/hashSubs";
import type { RecapItem } from "./recapTypes";

/**
 * One row per item for a day.
 *
 * `subs/subs` splits an item's day by price type and vendor, so a can of soda
 * that rang at regular and on sale comes back as two rows. A recap wants the
 * item, so they are folded together on the product code. The endpoint already
 * signs refunds and drops voids, so a plain sum is the item's day.
 *
 * The name comes from the row that took the most money: two rows of one code
 * can carry different spellings, and the main one is the one people know.
 */
export const foldItems = (rows: SubDeptMargin[]): RecapItem[] => {
  const byCode = new Map<string, RecapItem & { nameNet: number }>();
  for (const r of countedRows(rows)) {
    const net = r.total_sales - r.total_tax;
    const item = byCode.get(r.product_code) ?? {
      code: r.product_code,
      name: r.product_description,
      nameNet: -Infinity,
      subDeptId: r.sub_department,
      subDeptName: r.sub_department_description,
      units: 0,
      pounds: 0,
      net: 0,
    };
    item.units += r.qty || 0;
    item.pounds += r.weight || 0;
    item.net += net;
    if (net > item.nameNet) {
      item.name = r.product_description;
      item.nameNet = net;
      item.subDeptId = r.sub_department;
      item.subDeptName = r.sub_department_description;
    }
    byCode.set(r.product_code, item);
  }
  return [...byCode.values()].map(({ nameNet: _, ...item }) => item);
};

/** A day's items under their sub dept, each list biggest sales first. */
export const itemsBySubDept = (items: RecapItem[]) => {
  const by = new Map<number, RecapItem[]>();
  for (const i of items) by.set(i.subDeptId, [...(by.get(i.subDeptId) ?? []), i]);
  for (const list of by.values()) list.sort((a, b) => b.net - a.net);
  return by;
};

/** Name or code, ignoring case. An empty search matches everything. */
export const matchesSearch = (item: RecapItem, query: string) => {
  const q = query.trim().toLowerCase();
  return (
    !q || item.name.toLowerCase().includes(q) || item.code.toLowerCase().includes(q)
  );
};

/**
 * What a unit fetched: per pound for a weighed item, per unit otherwise.
 *
 * Dividing a weighed item by its units would give the average purchase, not
 * a price anyone posted. Null when there is nothing to divide by.
 */
export const avgPrice = (item: RecapItem) =>
  item.pounds > 0
    ? item.net / item.pounds
    : item.units !== 0
      ? item.net / item.units
      : null;
