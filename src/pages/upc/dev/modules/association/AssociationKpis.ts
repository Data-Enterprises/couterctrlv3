import type { ItemAssociate } from "../../../../../features/upcDevSlice";
import type { KpiCell } from "../../types";

export function getAssociationKpis(
  mainCount: number,
  level1Items: ItemAssociate[],
  level2Items: ItemAssociate[],
  level3Items: ItemAssociate[],
  singleSearchUpc: string,
  singleSearchItems: ItemAssociate[],
): KpiCell[] {
  return [
    { label: "Main UPCs", value: String(mainCount) },
    { label: "Level 1", value: String(level1Items.length), sub: "associations" },
    { label: "Level 2", value: level2Items.length ? String(level2Items.length) : "—", sub: "associations" },
    { label: "Level 3", value: level3Items.length ? String(level3Items.length) : "—", sub: "associations" },
    {
      label: "UPC search",
      value: singleSearchUpc || "—",
      sub: singleSearchUpc ? `${singleSearchItems.length} found` : undefined,
    },
  ];
}
