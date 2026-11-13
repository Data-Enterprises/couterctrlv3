// Hooks
import { useEffect, useMemo, useRef, useState } from "react";
import { useAppDispatch } from "../../../../../hooks";
import { useSalesCtx, useSalesState } from "../../hooks";
import { useSubDeptItems } from "./hooks";

// Redux
import {
  setExportSubDeptName,
  setExportSubDeptItems,
} from "../../../../../features/dev/devSalesLedgerSlice";

// Utils
import { buildDeptRows } from "./utils";

// Interfaces
import type { SevFilter } from "../../utils/index";
import type { DeptSortState, ItemSortState } from "./interfaces";

// Components
import SubDeptSignalList from "./components/SubDeptSignalList";
import SubDeptDetailPanel from "./components/SubDeptDetailPanel";

interface PopupSubDeptListProps {
  twDateLabel: string;
  lwDateLabel: string;
  lyDateLabel: string;
  storeId: number;
  // Items are fetched by storeid, which for co-located stores returns both
  // locations; scoped down to this number so the items agree with the rows.
  storeNumber: string;
  // The full 7 calendar days of the searched week (see StoreDetailPopup), so
  // the items' week totals agree with the KPI strip and sub-dept rows.
  twRealDates: string[];
}

/** The store panel's Sub depts tab: the graded sub departments on the left,
 *  the open one and its items on the right. */
const PopupSubDeptList = ({
  twDateLabel,
  lwDateLabel,
  lyDateLabel,
  storeId,
  storeNumber,
  twRealDates,
}: PopupSubDeptListProps) => {
  const dispatch = useAppDispatch();
  const { gradingMetric, subDeptThreshold, selectedSubDeptId } = useSalesCtx();
  const { subSales, subSalesWk2, subSalesWk3 } = useSalesState();
  const itemsLoading = useSubDeptItems(storeId, storeNumber, twRealDates);

  // A cleared threshold box keeps grading on the last valid amount, so rows do
  // not move until a new number is typed.
  const thresholdRef = useRef<number>(subDeptThreshold ?? 9);
  if (subDeptThreshold != null) thresholdRef.current = subDeptThreshold;
  const threshold = thresholdRef.current;

  // Kept here, above the empty-day return, so filters, sorts and the insight
  // survive a day with no rows.
  const [sevFilter, setSevFilter] = useState<SevFilter>("all");
  const [deptSort, setDeptSort] = useState<DeptSortState>(null);
  const [ctaOpen, setCtaOpen] = useState(false);
  const [itemSevFilter, setItemSevFilter] = useState<SevFilter>("all");
  const [itemTextFilter, setItemTextFilter] = useState("");
  // "" shows active and inactive together: the question is almost always
  // "what sold here", not "what still sells".
  const [itemActiveFilter, setItemActiveFilter] = useState("");
  const [itemSort, setItemSort] = useState<ItemSortState>(null);

  useEffect(() => {
    setItemSevFilter("all");
  }, [selectedSubDeptId]);

  const { rows, coverage } = useMemo(
    () => buildDeptRows(subSales, subSalesWk2, subSalesWk3, threshold, gradingMetric),
    [subSales, subSalesWk2, subSalesWk3, threshold, gradingMetric],
  );

  // With no rows the detail panel is not drawn, so the export's sub-dept items
  // are cleared here instead.
  useEffect(() => {
    if (rows.length) return;
    dispatch(setExportSubDeptName(""));
    dispatch(setExportSubDeptItems([]));
  }, [rows.length]);

  if (!rows.length) {
    return (
      <div className="flex items-center justify-center h-32 text-content text-sm">
        No sub department data
      </div>
    );
  }

  const selected =
    selectedSubDeptId !== null
      ? (rows.find((r) => r.id === selectedSubDeptId) ?? null)
      : null;

  return (
    <div className="flex h-full">
      <SubDeptSignalList
        rows={rows}
        coverage={coverage}
        threshold={threshold}
        sevFilter={sevFilter}
        setSevFilter={setSevFilter}
        deptSort={deptSort}
        setDeptSort={setDeptSort}
      />
      <SubDeptDetailPanel
        selected={selected}
        coverage={coverage}
        threshold={threshold}
        itemsLoading={itemsLoading}
        twDateLabel={twDateLabel}
        lwDateLabel={lwDateLabel}
        lyDateLabel={lyDateLabel}
        ctaOpen={ctaOpen}
        setCtaOpen={setCtaOpen}
        itemSevFilter={itemSevFilter}
        setItemSevFilter={setItemSevFilter}
        itemTextFilter={itemTextFilter}
        setItemTextFilter={setItemTextFilter}
        itemActiveFilter={itemActiveFilter}
        setItemActiveFilter={setItemActiveFilter}
        itemSort={itemSort}
        setItemSort={setItemSort}
      />
    </div>
  );
};

export default PopupSubDeptList;
