import type { AssociationItem } from "../../../../../features/upcDevSlice";

const SIGNIFICANT_DELTA_POINTS = 5;

// "Similar" is judged against every department a seed item belongs to, not
// just the first one — a seed set can genuinely span more than one
// department (e.g. a mixed dairy + produce search).
export function getSeedDepartments(items: AssociationItem[]): Set<number> {
  return new Set(items.filter((i) => i.is_seed).map((i) => i.sub_department));
}

export function groupAssociationItems(
  items: AssociationItem[],
  seedDepartments: Set<number>,
): { similar: AssociationItem[]; alongside: AssociationItem[] } {
  const similar: AssociationItem[] = [];
  const alongside: AssociationItem[] = [];
  for (const item of items) {
    (seedDepartments.has(item.sub_department) ? similar : alongside).push(item);
  }
  return { similar, alongside };
}

// The item currently being examined (re-root target) can never be its own
// association — everything else, including other seed-set members, stays
// visible since cross-seed overlap is real information.
export function excludeCurrentUpc(items: AssociationItem[], upc: string): AssociationItem[] {
  return items.filter((i) => i.product_code !== upc);
}

export type AttachRateDelta = {
  item: AssociationItem;
  prevRate: number;
  changed: boolean;
};

// Diffs a fresh seed-level result against the snapshot taken right before a
// seed-checkbox change, for the delta-on-uncheck banner. Only items present
// in both sets get a delta value — anything that dropped out entirely is a
// separate case (see disappearedItems), and anything new wasn't part of the
// "before" to compare against.
export function computeAttachRateDeltas(
  prevItems: AssociationItem[],
  nextItems: AssociationItem[],
): AttachRateDelta[] {
  const prevByCode = new Map(prevItems.map((i) => [i.product_code, i]));
  return nextItems
    .filter((item) => prevByCode.has(item.product_code))
    .map((item) => {
      const prevRate = prevByCode.get(item.product_code)!.attach_rate;
      return {
        item,
        prevRate,
        changed: Math.abs(item.attach_rate - prevRate) >= SIGNIFICANT_DELTA_POINTS,
      };
    });
}

export function disappearedItems(prevItems: AssociationItem[], nextItems: AssociationItem[]): AssociationItem[] {
  const nextCodes = new Set(nextItems.map((i) => i.product_code));
  return prevItems.filter((i) => !nextCodes.has(i.product_code));
}
