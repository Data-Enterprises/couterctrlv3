import { useAppSelector } from ".";
import { getStoreName } from "../utils";

/**
 * What the current search covers, named — the group's name when the user
 * searched a group, the store's when they picked one store.
 *
 * The multi-store Performance pages (Sales, Loss Prevention) show this in
 * their header. Reading it off `search.type` rather than off the results means
 * the header says what was *asked for*, which is what the user recognises: a
 * group that happened to return one store is still that group.
 *
 * Store names come from `assignedStores` via `getStoreName`, never from a
 * response payload — closed stores come back with a null name.
 */
export const useSearchScopeLabel = (): string => {
  const { type, lastStore, lastGroup } = useAppSelector((s) => s.search);
  const { assignedStores } = useAppSelector((s) => s.user);
  const { groups } = useAppSelector((s) => s.group);

  if (type === "Group") {
    // The list can still be loading on first paint; an empty string would
    // collapse the header row, so fall back to the generic word.
    return groups.find((g) => g.id === lastGroup)?.group_name ?? "Group";
  }
  return getStoreName(assignedStores, lastStore);
};
