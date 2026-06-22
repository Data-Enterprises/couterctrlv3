import { useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../../../hooks";
import { getWeekly } from "../../../api/sales";
import { addDays, formatGoliathDate, sameWeekDayLastYear } from "../../../utils";
import {
  setWeeklySales,
  setWeeklySalesLastWeek,
  setWeeklySalesLastYear,
} from "../../../features/salesSlice";
import {
  setHasSearched,
  setLedgerLoading,
} from "../../../features/salesLedgerSlice";
import LedgerEntryScreen from "./LedgerEntryScreen";
import LedgerStoreList from "./LedgerStoreList";
import LedgerStoreReport from "./LedgerStoreReport";

const SalesLedgerMobile = () => {
  const dispatch = useAppDispatch();
  const context = useAppSelector((s) => s.app);
  const search = useAppSelector((s) => s.search);
  const { hasSearched, ledgerLoading, screen } = useAppSelector((s) => s.salesLedger);

  // Lock body scroll for the entire mobile experience
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const twEnd = formatGoliathDate(search.singleDate);
  const twStart = addDays(search.singleDate, -6).toISOString().split("T")[0];
  const lwEnd = addDays(search.singleDate, -7).toISOString().split("T")[0];
  const lwStart = addDays(search.singleDate, -13).toISOString().split("T")[0];
  const lyEnd = sameWeekDayLastYear(twEnd).date;
  const lyStart = sameWeekDayLastYear(twStart).date;

  const isStore = search.type === "Store";
  const useGroups = isStore ? 0 : 1;
  const searchValue = isStore ? search.lastStore : search.lastGroup;
  const singleStore = isStore ? 1 : 0;

  const fetchLedger = async () => {
    dispatch(setLedgerLoading(true));
    dispatch(setWeeklySales([]));
    dispatch(setWeeklySalesLastWeek([]));
    dispatch(setWeeklySalesLastYear([]));
    try {
      const [tw, lw, ly] = await Promise.all([
        getWeekly(context.url, context.token, twStart, twEnd, useGroups, searchValue, singleStore),
        getWeekly(context.url, context.token, lwStart, lwEnd, useGroups, searchValue, singleStore),
        getWeekly(context.url, context.token, lyStart, lyEnd, useGroups, searchValue, singleStore),
      ]);
      if (tw.data.error === 0) dispatch(setWeeklySales(tw.data.sales));
      if (lw.data.error === 0) dispatch(setWeeklySalesLastWeek(lw.data.sales));
      if (ly.data.error === 0) dispatch(setWeeklySalesLastYear(ly.data.sales));
      dispatch(setHasSearched(true));
    } finally {
      dispatch(setLedgerLoading(false));
    }
  };

  if (!hasSearched || screen === "list") {
    return (
      <>
        {!hasSearched && <LedgerEntryScreen onSearch={fetchLedger} loading={ledgerLoading} />}
        {hasSearched && screen === "list" && <LedgerStoreList />}
      </>
    );
  }

  return <LedgerStoreReport />;
};

export default SalesLedgerMobile;
