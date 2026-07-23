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
