import type { ItemAssociate } from "../../../../../features/upcDevSlice";
import type { KpiCell } from "../../types";

export function getAssociationKpis(
  itemAssociations: ItemAssociate[][],
  upcs: string[],
): KpiCell[] {
  const level1Count = itemAssociations[0]?.length ?? 0;
  const levelsDeep = itemAssociations.length;

  return [
    { label: "Source UPCs", value: String(upcs.length) },
    { label: "Associations found", value: String(level1Count) },
    { label: "Levels explored", value: String(levelsDeep) },
  ];
}
