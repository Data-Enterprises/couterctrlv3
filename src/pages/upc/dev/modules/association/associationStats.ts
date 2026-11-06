// Interfaces
import type { DepartmentCount } from "./interfaces";
import type { AssociationItem, AssociationResult } from "../../../../../features/dev/devUpcDevSlice";

/** A seed set as one string: the UPCs sorted and joined, so the same set ticked
 *  in a different order is the same key. */
export const buildSeedKey = (upcs: string[]) => [...upcs].sort().join(",");

/**
 * The seed answer if it is for the UPCs ticked now, otherwise null, so a
 * previous seed's companions never show under a new seed set.
 */
export const seedDataFor = (
  selectedUpcs: string[],
  data: AssociationResult | null,
  dataKey: string,
): AssociationResult | null =>
  data && dataKey === buildSeedKey(selectedUpcs) ? data : null;

// Seed items are dropped from their own results (already in the Seed UPCs
// panel), and excludeUpc drops the re-root target.
export function getDisplayItems(items: AssociationItem[], excludeUpc?: string | null): AssociationItem[] {
  return items.filter((i) => !i.is_seed && i.product_code !== excludeUpc);
}

// The departments the query's own UPCs belong to, for the Cross-department
// KPI only. Works for a re-root too, since is_seed follows that fetch.
export function getQueryDepartments(items: AssociationItem[]): Set<number> {
  return new Set(items.filter((i) => i.is_seed).map((i) => i.sub_department));
}

// Companions per sub department, with revenue, by count. Shared by the
// "Top Sub Dept" KPI and the CTA breakdown so they agree.
export function getDepartmentBreakdown(items: AssociationItem[]): DepartmentCount[] {
  const counts = new Map<number, { label: string; count: number; revenue: number }>();
  for (const item of items) {
    const existing = counts.get(item.sub_department);
    if (existing) {
      existing.count += 1;
      existing.revenue += item.revenue;
    } else {
      counts.set(item.sub_department, {
        label: item.sub_department_description,
        count: 1,
        revenue: item.revenue,
      });
    }
  }
  return [...counts.entries()]
    .map(([deptId, { label, count, revenue }]) => ({ deptId, label, count, revenue }))
    .sort((a, b) => b.count - a.count);
}

// Splits the department breakdown into "same as seed" and "cross sub dept",
// in one place so the KPI strip and the CTA breakdown agree.
export function splitDeptBreakdown(
  breakdown: DepartmentCount[],
  queryDepartments: Set<number>,
): { cross: DepartmentCount[]; same: DepartmentCount[] } {
  return {
    cross: breakdown.filter((d) => !queryDepartments.has(d.deptId)),
    same: breakdown.filter((d) => queryDepartments.has(d.deptId)),
  };
}

// A straight sum of each side's department revenue, not an average of
// averages.
export function sumGroupRevenue(depts: DepartmentCount[]): number {
  return depts.reduce((sum, d) => sum + d.revenue, 0);
}

export function getTotalRevenue(items: AssociationItem[]): number {
  return items.reduce((sum, i) => sum + i.revenue, 0);
}

export function getTotalUnits(items: AssociationItem[]): number {
  return items.reduce((sum, i) => sum + i.qty, 0);
}

// A mean across qualifying baskets, not per-basket, so any label built from
// it must read as an average.
export function getAvgRevenuePerBasket(totalRevenue: number, totalBaskets: number): number {
  return totalBaskets > 0 ? totalRevenue / totalBaskets : 0;
}

export function getTopRevenueItem(items: AssociationItem[]): AssociationItem | undefined {
  return [...items].sort((a, b) => b.revenue - a.revenue)[0];
}

// Attach rate descending: the grid's default sort and the "strongest
// pairing" pick, shared so they agree.
export function sortByAttachRateDesc(items: AssociationItem[]): AssociationItem[] {
  return [...items].sort((a, b) => b.attach_rate - a.attach_rate);
}

export function getTopCompanion(items: AssociationItem[]): AssociationItem | undefined {
  return sortByAttachRateDesc(items)[0];
}

export function getCrossDeptCount(items: AssociationItem[], queryDepartments: Set<number>): number {
  return items.filter((i) => !queryDepartments.has(i.sub_department)).length;
}

// Weighted by basket_count, Σ(attach_rate × basket_count) ÷ Σ(basket_count),
// so a rate backed by more baskets counts for more.
export function getWeightedAvgAttachRate(items: AssociationItem[]): number {
  const totalBaskets = items.reduce((sum, i) => sum + i.basket_count, 0);
  if (totalBaskets === 0) return 0;
  const weightedSum = items.reduce((sum, i) => sum + i.attach_rate * i.basket_count, 0);
  return weightedSum / totalBaskets;
}
