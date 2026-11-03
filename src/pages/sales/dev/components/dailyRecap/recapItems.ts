import type { SubDeptMargin } from "../../../../../interfaces";
import { countedRows } from "../../../../../utils/hashSubs";
import type { RecapItem } from "./recapTypes";

/**
 * One row per item for a day, for the Daily Recap export.
 *
 * `subs/subs` splits an item's day by price type and vendor, so a can of soda
 * that rang at regular and on sale comes back as two rows. The export wants
 * the item, so they are folded together on the product code. The endpoint
 * already signs refunds and drops voids, so a plain sum is the item's day.
 *
 * The name comes from the row that took the most money: two rows of one code
 * can carry different spellings, and the main one is the one people know.
 */
export const foldItems = (rows: SubDeptMargin[]): RecapItem[] => {
  const byCode = new Map<string, { item: RecapItem; nameNet: number }>();
  for (const r of countedRows(rows)) {
    const net = r.total_sales - r.total_tax;
    const held = byCode.get(r.product_code) ?? {
      item: {
        code: r.product_code,
        name: r.product_description,
        subDeptId: r.sub_department,
        subDeptName: r.sub_department_description,
        units: 0,
        pounds: 0,
        net: 0,
      },
      nameNet: -Infinity,
    };
    held.item.units += r.qty || 0;
    held.item.pounds += r.weight || 0;
    held.item.net += net;
    if (net > held.nameNet) {
      held.item.name = r.product_description;
      held.item.subDeptId = r.sub_department;
      held.item.subDeptName = r.sub_department_description;
      held.nameNet = net;
    }
    byCode.set(r.product_code, held);
  }
  return [...byCode.values()].map((h) => h.item);
};
