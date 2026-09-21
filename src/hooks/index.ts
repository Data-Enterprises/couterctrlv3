import {
  type TypedUseSelectorHook,
  useDispatch,
  useSelector,
} from "react-redux";
import type { RootState, AppDispatch } from "../store";
import { COMING_SOON_MIN_LEVEL } from "../utils/comingSoon";
import { isGroupSearch } from "../features/searchSlice";

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

/** Whether this user is allowed the unreleased pages — and so whether the
 *  entry points that lead to them should be on screen at all. Only ever on
 *  the dev API: Coming Soon pages are dev-only. See `utils/comingSoon` for why
 *  the level is shared rather than inlined. */
export const useCanSeeComingSoon = (): boolean => {
  const level = useAppSelector((s) => s.user.userLevel);
  const apiEnv = useAppSelector((s) => s.app.apiEnv);
  return apiEnv === "dev" && level >= COMING_SOON_MIN_LEVEL;
};

/**
 * Whether the search slice has anywhere to search yet, and what the button
 * should ask for while it doesn't. The same rule as `SearchCard`: both sides
 * start at id 0, and a search for store 0 comes back empty and reads as "no
 * data" rather than "you haven't picked anywhere". For the pages that build
 * their own search form instead of using the shared cards.
 */
export const useSearchPick = () => {
  const search = useAppSelector((s) => s.search);
  const group = isGroupSearch(search.type);
  const nothingPicked = group ? search.selectedGroup.id === 0 : search.selectedStore.storeid === 0;
  return { nothingPicked, pickLabel: group ? "Select Group" : "Select Store" };
};

export const useStoreName = (storeid: number, fallback?: string): string => {
  const assignedStores = useAppSelector((s) => s.user.assignedStores);
  const match = assignedStores.find((s) => s.storeid === storeid);
  return match?.store_name ?? fallback ?? String(storeid);
};
