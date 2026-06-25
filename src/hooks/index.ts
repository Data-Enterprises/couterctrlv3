import {
  type TypedUseSelectorHook,
  useDispatch,
  useSelector,
} from "react-redux";
import type { RootState, AppDispatch } from "../store";

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export const useStoreName = (storeid: number, fallback?: string): string => {
  const assignedStores = useAppSelector((s) => s.user.assignedStores);
  const match = assignedStores.find((s) => s.storeid === storeid);
  return match?.store_name ?? fallback ?? String(storeid);
};
