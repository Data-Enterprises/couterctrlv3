/**
 * A group's stores narrowed to the ones the user is assigned.
 *
 * The refactored backend refuses a store list that names any store the user
 * isn't assigned, with a 403 for the whole request. A shared group, or a group
 * read with its owner's id, can hold such stores, so a page that sends a
 * group's store list sends only the user's own.
 */
export const onlyAssigned = <T extends { storeid: number }>(
  stores: T[],
  assigned: { storeid: number }[],
): T[] => {
  const mine = new Set(assigned.map((s) => s.storeid));
  return stores.filter((s) => mine.has(s.storeid));
};

/** Said when a group has stores but none of them are the user's. */
export const NONE_ASSIGNED = "None of this group's stores are assigned to you.";

/** Said when some of a group's stores were left out. */
export const leftOutMessage = (count: number) =>
  `${count} of this group's stores ${count === 1 ? "isn't" : "aren't"} assigned to you and ${count === 1 ? "was" : "were"} left out.`;
