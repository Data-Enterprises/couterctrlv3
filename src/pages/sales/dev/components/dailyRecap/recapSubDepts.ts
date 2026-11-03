import type { SubSale } from "../../../../../interfaces";
import { splitHash } from "../../../../../utils/hashSubs";
import type { RecapLeftOut, RecapSubDept } from "./recapTypes";

const net = (s: SubSale) => s.total_sales - s.total_tax;

/**
 * One day's sub depts, biggest sales first.
 *
 * Only the sub depts the store counts are listed, so the rows add up to the
 * day's net sales the way the day card does. Fuel, lottery and cash come back
 * separately: the reader is owed the figure that was left out, just not inside
 * a list that is supposed to total to the card.
 *
 * Keyed on the sub dept number, which is safe here: this is one store, and
 * numbers only differ in meaning between stores.
 */
export const subDeptsForDay = (
  subs: SubSale[],
  date: string,
): { rows: RecapSubDept[]; leftOut: RecapLeftOut[] } => {
  const day = subs.filter((s) => s.sale_date.split("T")[0] === date);
  const { counted, hash } = splitHash(day);

  const byId = new Map<number, RecapSubDept>();
  for (const s of counted) {
    const row = byId.get(s.sub_department) ?? {
      id: s.sub_department,
      name: s.sub_department_description,
      net: 0,
      units: 0,
      pounds: 0,
      share: 0,
    };
    row.net += net(s);
    row.units += s.qty || 0;
    row.pounds += s.weight || 0;
    byId.set(s.sub_department, row);
  }
  const rows = [...byId.values()].sort((a, b) => b.net - a.net);
  const total = rows.reduce((t, r) => t + r.net, 0);
  for (const r of rows) r.share = total > 0 ? (r.net / total) * 100 : 0;

  const leftBy = new Map<string, number>();
  for (const s of hash) {
    const name = s.sub_department_description;
    leftBy.set(name, (leftBy.get(name) ?? 0) + net(s));
  }
  const leftOut = [...leftBy]
    .map(([name, n]) => ({ name, net: n }))
    .sort((a, b) => b.net - a.net);

  return { rows, leftOut };
};
