// Interfaces
import type { CompanyBaseGroup } from "../../../../../../../../interfaces";

/**
 * A company or group ticked in its own right, not inferred from a store, so
 * ticking East means East, and a company with no stores can still be given.
 */
export const toggleIn = (list: number[], id: number): number[] =>
  list.includes(id) ? list.filter((x) => x !== id) : [...list, id];

/**
 * Filters the list of groups based on the search string.
 * Only groups whose name includes the search string (case-insensitive) are returned.
 */
export const filterGroupsBySearch = (
  groups: CompanyBaseGroup[],
  search: string,
) => groups.filter((g) => g.name.toLowerCase().includes(search.toLowerCase()));

/**
 * Filters the list of groups to only include those whose IDs are in the openGroupIds set.
 */
export const filterOpenGroups = (
  groups: CompanyBaseGroup[],
  openGroupIds: Set<number>,
) => groups.filter((g) => openGroupIds.has(g.id));
