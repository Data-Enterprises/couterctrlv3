import type { AssociationItem } from "../../../../../features/upcDevSlice";

const SIGNIFICANT_DELTA_POINTS = 5;

// Seed items showing up in their own results isn't useful cross-merchandising
// information the way it first seemed — it just re-lists what's already
// visible in the Seed UPCs panel. excludeUpc additionally drops the current
// re-root target, since an item can never be its own association.
export function getDisplayItems(items: AssociationItem[], excludeUpc?: string | null): AssociationItem[] {
  return items.filter((i) => !i.is_seed && i.product_code !== excludeUpc);
}

export type AttachRateDelta = {
  item: AssociationItem;
  prevRate: number;
  changed: boolean;
};

// Diffs a fresh seed-level result against the snapshot taken right before a
// seed-checkbox change, for the per-row "was X% with N items" note. Only
// items present in both sets get a delta value — anything new or dropped
// entirely just doesn't get one. Callers should pass already-filtered
// (getDisplayItems) lists so the delta lines up with what the table shows.
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
