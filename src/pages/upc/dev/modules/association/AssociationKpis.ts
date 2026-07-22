import type { AssociationResult } from "../../../../../features/upcDevSlice";
import type { KpiCell } from "../../types";

export function getAssociationKpis(
  seedCount: number,
  seedData: AssociationResult | null,
  rerootUpc: string | null,
  rerootData: AssociationResult | null,
  rerootLabel: string,
): KpiCell[] {
  const active = rerootUpc ? rerootData : seedData;
  const departmentCount = active ? new Set(active.items.map((i) => i.sub_department)).size : 0;

  return [
    { label: "Seed UPCs", value: String(seedCount) },
    { label: "Baskets", value: active ? active.totalBaskets.toLocaleString() : "—" },
    { label: "Associations", value: active ? String(active.items.length) : "—", sub: "found" },
    { label: "Departments", value: active ? String(departmentCount) : "—" },
    { label: "Viewing", value: rerootUpc ? rerootLabel : "Seed set" },
  ];
}
