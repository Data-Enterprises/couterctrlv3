// Utils
import { formatCurrency2 } from "../../../../../utils";
import {
  getDisplayItems,
  getQueryDepartments,
  getDepartmentBreakdown,
  splitDeptBreakdown,
  getTotalRevenue,
  getTotalUnits,
  getTopRevenueItem,
  getCrossDeptCount,
} from "./associationStats";

// Interfaces
import type { AssociationResult } from "../../../../../features/dev/devUpcDevSlice";
import type { KpiCell } from "../../interfaces";

// 5 tiles, by impact: dollar scale, the dollar opportunity, volume, then the
// two department tiles together.
export function getAssociationKpis(
  seedData: AssociationResult | null,
  rerootUpc: string | null,
  rerootData: AssociationResult | null,
): KpiCell[] {
  const active = rerootUpc ? rerootData : seedData;
  const items = active ? getDisplayItems(active.items, rerootUpc) : [];
  const totalRevenue = getTotalRevenue(items);
  const totalUnits = getTotalUnits(items);
  const topRevenueItem = active ? getTopRevenueItem(items) : undefined;
  const queryDepartments = active ? getQueryDepartments(active.items) : new Set<number>();
  const crossDeptCount = getCrossDeptCount(items, queryDepartments);
  const deptBreakdown = getDepartmentBreakdown(items);
  const { cross: crossDeptBreakdown } = splitDeptBreakdown(deptBreakdown, queryDepartments);

  const topDept = deptBreakdown[0];

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
      sub: active ? `${crossDeptCount} items` : undefined,
      value: active ? `${crossDeptBreakdown.length} depts` : "—",
    },
    {
      label: "Top Sub Dept",
      value: topDept?.label ?? "—",
      sub: topDept ? `${topDept.count} items` : undefined,
      subVariant: topDept ? "neutral" : undefined,
    },
  ];
}
