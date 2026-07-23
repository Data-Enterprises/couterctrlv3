import type { AssociationResult } from "../../../../../features/upcDevSlice";
import type { KpiCell } from "../../types";
import { getDisplayItems } from "./associationStats";

export function getAssociationKpis(
  seedCount: number,
  seedData: AssociationResult | null,
  rerootUpc: string | null,
  rerootData: AssociationResult | null,
  rerootLabel: string,
): KpiCell[] {
  const active = rerootUpc ? rerootData : seedData;
  const items = active ? getDisplayItems(active.items, rerootUpc) : [];
  const departmentCount = new Set(items.map((i) => i.sub_department)).size;

  return [
    { label: "Seed UPCs", value: String(seedCount) },
    { label: "Baskets", value: active ? active.totalBaskets.toLocaleString() : "—" },
    { label: "Associations", value: active ? String(items.length) : "—", sub: "found" },
    { label: "Departments", value: active ? String(departmentCount) : "—" },
    { label: "Viewing", value: rerootUpc ? rerootLabel : "Seed set" },
  ];
}
