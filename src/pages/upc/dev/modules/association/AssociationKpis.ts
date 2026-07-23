import { formatCurrency2 } from "../../../../../utils";
import type { AssociationResult } from "../../../../../features/upcDevSlice";
import type { KpiCell } from "../../types";
import { getDisplayItems, getQueryDepartments, getDepartmentBreakdown } from "./associationStats";

// 5 tiles, ordered by impact: dollar scale first, then the specific dollar
// opportunity to act on, then volume, then the two department-flavored
// tiles grouped together at the end (how many are cross-department, which
// department shows up most) since they're both categorical context rather
// than a headline finding. "Viewing" and "Seed UPCs" were both cut once
// something else already displayed the same fact — the left column's own
// header already names what's being viewed and lists every seed UPC.
export function getAssociationKpis(
  seedData: AssociationResult | null,
  rerootUpc: string | null,
  rerootData: AssociationResult | null,
): KpiCell[] {
  const active = rerootUpc ? rerootData : seedData;
  const items = active ? getDisplayItems(active.items, rerootUpc) : [];
  const totalRevenue = items.reduce((sum, i) => sum + i.revenue, 0);
  const totalUnits = items.reduce((sum, i) => sum + i.qty, 0);
  const topRevenueItem = active ? [...items].sort((a, b) => b.revenue - a.revenue)[0] : undefined;
  const queryDepartments = active ? getQueryDepartments(active.items) : new Set<number>();
  const crossDeptCount = items.filter((i) => !queryDepartments.has(i.sub_department)).length;

  const topDept = getDepartmentBreakdown(items)[0];

  return [
    { label: "Total revenue", value: active ? formatCurrency2(totalRevenue) : "—", sub: "companions" },
    {
      label: "Top revenue",
      value: topRevenueItem?.product_description ?? "—",
      sub: topRevenueItem ? formatCurrency2(topRevenueItem.revenue) : undefined,
      subVariant: topRevenueItem ? "neutral" : undefined,
    },
    { label: "Total units", value: active ? totalUnits.toLocaleString() : "—" },
    {
      label: "Cross Sub Dept",
      value: active ? String(crossDeptCount) : "—",
      sub: active ? "items" : undefined,
    },
    {
      label: "Top Sub Dept",
      value: topDept?.label ?? "—",
      sub: topDept ? `${topDept.count} items` : undefined,
      subVariant: topDept ? "neutral" : undefined,
    },
  ];
}
