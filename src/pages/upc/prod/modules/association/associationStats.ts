import type { AssociationItem } from "../../../../../features/upcDevSlice";

// Seed items showing up in their own results isn't useful cross-merchandising
// information the way it first seemed — it just re-lists what's already
// visible in the Seed UPCs panel. excludeUpc additionally drops the current
// re-root target, since an item can never be its own association.
export function getDisplayItems(items: AssociationItem[], excludeUpc?: string | null): AssociationItem[] {
  return items.filter((i) => !i.is_seed && i.product_code !== excludeUpc);
}

// The department(s) this fetch's own query UPCs belong to — used only for
// the Cross-department KPI (how many companions sit outside the thing
// you're actually examining), not for grouping/splitting the table itself.
// Works the same for a re-root view as the seed view: is_seed reflects
// membership in whichever upcs list drove that specific fetch, so this
// naturally re-centers on the re-root target without special-casing it.
export function getQueryDepartments(items: AssociationItem[]): Set<number> {
  return new Set(items.filter((i) => i.is_seed).map((i) => i.sub_department));
}

// deptId is the numeric sub_department, kept alongside the display label so
// callers can check membership against getQueryDepartments' Set<number>
// (e.g. to split cross-sub-dept vs. same-as-seed) without string-matching
// descriptions, which aren't guaranteed to be a reliable join key.
export type DepartmentCount = { deptId: number; label: string; count: number; revenue: number };

// How many displayed companions fall in each sub department, and how much
// revenue they generated, sorted by count descending. Shared by the
// "Top Sub Dept" KPI (just the first entry) and the CTA insight's full
// breakdown, so the two can't drift into disagreeing about the tally.
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

// Splits an already-computed department breakdown into departments that
// match the query's own seed departments ("same as seed") vs. everything
// else ("cross sub dept"). Centralized so the KPI strip and the CTA
// breakdown can't disagree about which side a department landed on.
export function splitDeptBreakdown(
  breakdown: DepartmentCount[],
  queryDepartments: Set<number>,
): { cross: DepartmentCount[]; same: DepartmentCount[] } {
  return {
    cross: breakdown.filter((d) => !queryDepartments.has(d.deptId)),
    same: breakdown.filter((d) => queryDepartments.has(d.deptId)),
  };
}

// Straight sum, not an average of averages — each department entry already
// carries its own summed revenue, so this just totals whichever side of the
// cross/same split a caller wants a figure for.
export function sumGroupRevenue(depts: DepartmentCount[]): number {
  return depts.reduce((sum, d) => sum + d.revenue, 0);
}

export function getTotalRevenue(items: AssociationItem[]): number {
  return items.reduce((sum, i) => sum + i.revenue, 0);
}

export function getTotalUnits(items: AssociationItem[]): number {
  return items.reduce((sum, i) => sum + i.qty, 0);
}

// A mean across all qualifying baskets, not a per-basket attribution —
// individual baskets vary a lot (some $0, some well above this), so any
// label built from this has to read as an average, not an exact figure.
export function getAvgRevenuePerBasket(totalRevenue: number, totalBaskets: number): number {
  return totalBaskets > 0 ? totalRevenue / totalBaskets : 0;
}

export function getTopRevenueItem(items: AssociationItem[]): AssociationItem | undefined {
  return [...items].sort((a, b) => b.revenue - a.revenue)[0];
}

// Attach rate descending is both the grid's own default sort and the
// "strongest single pairing" pick — shared here so the two can never
// disagree about which companion is actually on top.
export function sortByAttachRateDesc(items: AssociationItem[]): AssociationItem[] {
  return [...items].sort((a, b) => b.attach_rate - a.attach_rate);
}

export function getTopCompanion(items: AssociationItem[]): AssociationItem | undefined {
  return sortByAttachRateDesc(items)[0];
}

export function getCrossDeptCount(items: AssociationItem[], queryDepartments: Set<number>): number {
  return items.filter((i) => !queryDepartments.has(i.sub_department)).length;
}

// Weighted by basket_count rather than a plain mean of each companion's own
// rate — a companion with only 2 baskets of evidence shouldn't move the
// average as much as one with 40. Σ(attach_rate × basket_count) ÷
// Σ(basket_count), so a rate backed by more baskets counts for more.
export function getWeightedAvgAttachRate(items: AssociationItem[]): number {
  const totalBaskets = items.reduce((sum, i) => sum + i.basket_count, 0);
  if (totalBaskets === 0) return 0;
  const weightedSum = items.reduce((sum, i) => sum + i.attach_rate * i.basket_count, 0);
  return weightedSum / totalBaskets;
}
