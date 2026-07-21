import type { ItemAssociate } from "../../../../../features/upcDevSlice";

// The API can return the same product_code more than once (e.g. across
// separate periods) — sum qty per code instead of showing duplicate rows.
export function dedupeAssociations(items: ItemAssociate[]): ItemAssociate[] {
  const byCode = new Map<string, ItemAssociate>();
  for (const item of items) {
    const existing = byCode.get(item.product_code);
    if (existing) {
      existing.qty += item.qty;
    } else {
      byCode.set(item.product_code, { ...item });
    }
  }
  return Array.from(byCode.values());
}

// Drop items already selected upstream in the drill path, so an item you've
// already picked can't reappear as a "new" association at the next level.
export function excludeUpcs(items: ItemAssociate[], exclude: string[]): ItemAssociate[] {
  if (!exclude.length) return items;
  const excludeSet = new Set(exclude);
  return items.filter((item) => !excludeSet.has(item.product_code));
}
