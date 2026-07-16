import { useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../../../hooks";
import { getWeekly } from "../../../api/sales";
import {
  addDays,
  formatGoliathDate,
  sameWeekDayLastYear,
} from "../../../utils";
import {
  setWeeklySales,
  setWeeklySalesLastWeek,
  setWeeklySalesLastYear,
} from "../../../features/salesSlice";
import {
  setHasSearched,
  setLedgerLoading,
} from "../../../features/salesLedgerSlice";
import SearchCard from "../../../components/SearchCard";
import LedgerStoreList from "./LedgerStoreList";
import LedgerStoreReport from "./LedgerStoreReport";

const SalesLedgerMobile = () => {
  const dispatch = useAppDispatch();
  const context = useAppSelector((s) => s.app);
  const search = useAppSelector((s) => s.search);
  const { weeklySales } = useAppSelector((s) => s.sales);
  const { hasSearched, ledgerLoading, screen } = useAppSelector(
    (s) => s.salesLedger,
  );

  // Lock body scroll for the entire mobile experience
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const twEnd = formatGoliathDate(search.singleDate);
  const twStart = addDays(search.singleDate, -6).toISOString().split("T")[0];
  const lwEnd = addDays(search.singleDate, -7).toISOString().split("T")[0];
  const lwStart = addDays(search.singleDate, -13).toISOString().split("T")[0];
  // Shifting just the two week endpoints breaks when one of them lands on a
  // fixed-date holiday (e.g. July 4th) — that endpoint gets snapped to the
  // exact holiday date last year while the other gets a plain weekday-preserving
  // shift, desyncing the range from the per-day lookups elsewhere. Shifting
  // every day in the week and taking the min/max keeps the range correct.
  const twWeekDates = Array.from(
    { length: 7 },
    (_, i) => addDays(twStart, i).toISOString().split("T")[0],
  );
  const lyWeekDates = twWeekDates
    .map((d) => sameWeekDayLastYear(d).date)
    .sort();
  const lyStart = lyWeekDates[0];
  const lyEnd = lyWeekDates[lyWeekDates.length - 1];

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
        getWeekly(
          context.url,
          context.token,
          twStart,
          twEnd,
          useGroups,
          searchValue,
          singleStore,
        ),
        getWeekly(
          context.url,
          context.token,
          lwStart,
          lwEnd,
          useGroups,
          searchValue,
          singleStore,
        ),
        getWeekly(
          context.url,
          context.token,
          lyStart,
          lyEnd,
          useGroups,
          searchValue,
          singleStore,
        ),
      ]);
      if (tw.data.error === 0) dispatch(setWeeklySales(tw.data.sales));
      if (lw.data.error === 0) dispatch(setWeeklySalesLastWeek(lw.data.sales));
      if (ly.data.error === 0) dispatch(setWeeklySalesLastYear(ly.data.sales));
      dispatch(setHasSearched(true));
    } finally {
      dispatch(setLedgerLoading(false));
    }
  };

  if (screen === "report") return <LedgerStoreReport />;

  const hasData = weeklySales.length > 0;

  return (
    <div className="flex flex-col h-[calc(100dvh-3rem)] overflow-hidden">
      {!hasSearched || (!ledgerLoading && weeklySales.length === 0) ? (
        <SearchCard
          top
          title="Weekly Performance"
          description="Select a store or group and end date."
          buttonLabel="Load stores"
          singleDate
          onSearch={fetchLedger}
          loading={ledgerLoading}
          onBack={hasData ? () => dispatch(setHasSearched(true)) : undefined}
          notice={
            hasSearched
              ? "No data found for that search — try a different store, group, or week."
              : undefined
          }
        />
      ) : (
        <div className="flex-1 overflow-hidden">
          <LedgerStoreList />
        </div>
      )}
    </div>
  );
};

export default SalesLedgerMobile;
