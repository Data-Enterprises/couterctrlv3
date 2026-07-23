import { formatCurrency2 } from "../../../../../utils";
import type { AssociationResult } from "../../../../../features/upcDevSlice";
import type { KpiCell } from "../../types";
import { getDisplayItems } from "./associationStats";

// Deliberately just 3 tiles, not the usual 5 — Baskets/Departments/
// Companions-found already live in the per-view KpiTileGrid just below this
// strip (see AssociationDetailPanel.tsx), and repeating the same numbers up
// here read as a second, redundant grid rather than new information.
// UpcKpiStrip's column count is dynamic, so returning fewer tiles doesn't
// leave empty grid cells. Total revenue is the one genuinely new fact this
// level can add — the dollar weight of the active view's companions, which
// the per-view strip doesn't otherwise surface as a single number.
export function getAssociationKpis(
  seedCount: number,
  seedData: AssociationResult | null,
  rerootUpc: string | null,
  rerootData: AssociationResult | null,
  rerootLabel: string,
): KpiCell[] {
  const active = rerootUpc ? rerootData : seedData;
  const items = active ? getDisplayItems(active.items, rerootUpc) : [];
  const totalRevenue = items.reduce((sum, i) => sum + i.revenue, 0);

  return [
    { label: "Seed UPCs", value: String(seedCount) },
    { label: "Viewing", value: rerootUpc ? rerootLabel : "Seed set" },
    { label: "Total revenue", value: active ? formatCurrency2(totalRevenue) : "—", sub: "companions" },
  ];
}
