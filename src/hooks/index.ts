import {
  type TypedUseSelectorHook,
  useDispatch,
  useSelector,
} from "react-redux";
import type { RootState, AppDispatch } from "../store";
import { COMING_SOON_MIN_LEVEL } from "../utils/comingSoon";

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

/** Whether this user is allowed the unreleased pages — and so whether the
 *  entry points that lead to them should be on screen at all. See
 *  `utils/comingSoon` for why the level is shared rather than inlined. */
export const useCanSeeComingSoon = (): boolean =>
  useAppSelector((s) => s.user.userLevel) >= COMING_SOON_MIN_LEVEL;

export const useStoreName = (storeid: number, fallback?: string): string => {
  const assignedStores = useAppSelector((s) => s.user.assignedStores);
  const match = assignedStores.find((s) => s.storeid === storeid);
  return match?.store_name ?? fallback ?? String(storeid);
};
