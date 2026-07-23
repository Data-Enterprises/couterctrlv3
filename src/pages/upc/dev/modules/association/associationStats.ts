import type { AssociationItem } from "../../../../../features/upcDevSlice";

// Seed items showing up in their own results isn't useful cross-merchandising
// information the way it first seemed — it just re-lists what's already
// visible in the Seed UPCs panel. excludeUpc additionally drops the current
// re-root target, since an item can never be its own association.
export function getDisplayItems(items: AssociationItem[], excludeUpc?: string | null): AssociationItem[] {
  return items.filter((i) => !i.is_seed && i.product_code !== excludeUpc);
}
