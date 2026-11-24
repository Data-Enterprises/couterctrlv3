// Hooks
import { useMemo, type SetStateAction } from "react";
import { useAppDispatch } from "../../../../../../hooks";
import { useSalesCtx } from "../../../hooks";

// Redux
import { setTop200View } from "../../../../../../features/dev/devSalesLedgerSlice";

// Utils
import {
  pointsFor,
  topItemInsight,
  type TopItemCompared,
  type TopItemSort,
} from "../utils/topItems";

/** The Top 200 tab's list state and open item, read and set through the
 *  slice so the list, the landing and the item report share them. */
export const useTop200View = () => {
  const dispatch = useAppDispatch();
  const { top200View } = useSalesCtx();

  const setSearch = (search: string) => dispatch(setTop200View({ search }));
  const setDept = (dept: string) => dispatch(setTop200View({ dept }));
  const setSort = (next: SetStateAction<TopItemSort>) =>
    dispatch(
      setTop200View({
        sort: typeof next === "function" ? next(top200View.sort) : next,
      }),
    );
  const setSelectedCode = (selectedCode: string | null) =>
    dispatch(setTop200View({ selectedCode }));

  return { ...top200View, setSearch, setDept, setSort, setSelectedCode };
};

/** The picked item's row, its price points and its insight line. */
export const useSelectedItem = (ranked: TopItemCompared[]) => {
  const { topItemPoints } = useSalesCtx();
  const { selectedCode } = useTop200View();

  const selected =
    ranked.find((r) => r.ty.product_code === selectedCode) ?? null;
  const points = useMemo(
    () => (selected ? pointsFor(topItemPoints, selected.ty.product_code) : []),
    [selected, topItemPoints],
  );
  const insight = selected ? topItemInsight(selected.ty, points) : null;

  return { selected, points, insight };
};
