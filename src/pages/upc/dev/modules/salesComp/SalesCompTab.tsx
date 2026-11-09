// Hooks
import { useEffect, useMemo, useState } from "react";
import { useAppDispatch } from "../../../../../hooks";
import { useToast } from "../../../../../components/toasts/hooks/useToast";
import { useUpcDevCtx } from "../../hooks/useUpcDevCtx";
import { useAbandonedRetry } from "../../hooks/useAbandonedRetry";

// Redux
import {
  mergeDevSalesComp,
  mergeDevSalesCompLY,
  setDevSalesCompLoading,
  setDevSalesCompLYLoading,
  setDevUpcItems,
} from "../../../../../features/dev/devUpcDevSlice";

// API
import { getSalesComp } from "../../../../../api/upc";

// Utils
import { sameWeekDayLastYear } from "../../../../../utils";
import { upcQueue } from "../../upcQueue";
import { missingFrom } from "../../coverage";
import { answerOf } from "../../utils";
import {
  combineSalesCompRows,
  computeUpcSalesCompStats,
  salesCompCodes,
  salesCompRange,
} from "./salesCompStats";
import { isoToMdy } from "./utils";

// Interfaces
import type { UpcSalesComp } from "../../../../../interfaces";

// Components
import SalesCompLeftList from "./components/SalesCompLeftList";
import SalesCompDetailPanel from "./components/SalesCompDetailPanel";

/** The UPC List's Sales Comp tab: fetches this year's and last year's sales for the
 *  searched UPCs on its first visit, then shows the items in a left list and the picked
 *  item's comparison on the right. */
const SalesCompTab = () => {
  const ctx = useUpcDevCtx();
  const dispatch = useAppDispatch();
  const toast = useToast();
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [retryTick, retry] = useAbandonedRetry();

  // Both fetches ask only for the UPCs they're missing, joined into a string so
  // the effect fires exactly when the gap changes. searchedUpcs, not upcs (see
  // PriceOptTab).
  const missingTy = missingFrom(ctx.searchedUpcs, ctx.salesCompCoverage);
  const missingLy = missingFrom(ctx.searchedUpcs, ctx.salesCompLYCoverage);
  const missingTyKey = missingTy.join(",");
  const missingLyKey = missingLy.join(",");

  // This year: this tab's own fetch, made on its first visit.
  useEffect(() => {
    if (ctx.activeTab !== "salesComp") return;
    if (ctx.salesCompLoading || !ctx.storeids || !missingTyKey) return;

    const load = async () => {
      dispatch(setDevSalesCompLoading(true));
      let abandoned = false;
      try {
        const res = await upcQueue.enqueue(`salesComp:ty:${missingTyKey}`, (signal) =>
          getSalesComp(ctx.url, ctx.token, ctx.storeids, ctx.startDate, ctx.endDate, missingTyKey, signal),
        );
        // Superseded by a newer search — that run owns this state now. Looked
        // at again once loading clears, against the search as it is then.
        if (!res) {
          abandoned = true;
          return;
        }

        const j = res.data;
        const answer = answerOf(j);
        // A failure is a failure, not an empty answer, so coverage is left
        // alone and the tab asks again. "No data was returned." is a real
        // answer and covers them (see answerOf).
        if (ctx.fixes && answer === "failed") {
          toast.warn(j.msg || "Sales comparison failed for these UPCs");
          return;
        }
        // Combined on the way in, so the table, KPI strip and export all see
        // one row per UPC per week — see combineSalesCompRows.
        const rows: UpcSalesComp[] =
          answer === "ok" && j.daily?.length > 0 ? combineSalesCompRows(j.daily) : [];
        // Merged against the UPCs asked for, not those that answered: a UPC with
        // no sales returns nothing and still counts as covered.
        dispatch(mergeDevSalesComp({ rows, codes: missingTy }));
        // Descriptions for the left panel roster, which was seeded with codes
        // only at search time.
        dispatch(
          setDevUpcItems(
            rows.map((r) => ({ product_code: r.product_code, description: r.description })),
          ),
        );
      } catch {
        // Coverage is left alone, so revisiting the tab retries.
      } finally {
        dispatch(setDevSalesCompLoading(false));
        if (abandoned) retry();
      }
    };

    load();
  }, [ctx.activeTab, missingTyKey, retryTick]);

  // Last year is a second call to the heaviest endpoint, so only this tab pays
  // for it. Supplementary: a failed or empty answer leaves the tab on TY alone
  // (`hasLY` blanks the vs-LY figures), and coverage extends either way.
  useEffect(() => {
    if (ctx.activeTab !== "salesComp") return;
    if (ctx.salesCompLYLoading || !ctx.storeids || !missingLyKey) return;

    const load = async () => {
      dispatch(setDevSalesCompLYLoading(true));
      let abandoned = false;
      try {
        const res = await upcQueue.enqueue(`salesComp:ly:${missingLyKey}`, (signal) =>
          getSalesComp(
            ctx.url,
            ctx.token,
            ctx.storeids,
            isoToMdy(sameWeekDayLastYear(ctx.startDate).date),
            isoToMdy(sameWeekDayLastYear(ctx.endDate).date),
            missingLyKey,
            signal,
          ),
        );
        if (!res) {
          abandoned = true;
          return;
        }

        const j = res.data;
        const answer = answerOf(j);
        // Same guard as this year, without a toast: `hasLY` already shows a
        // missing last year. A new item's empty answer covers it.
        if (ctx.fixes && answer === "failed") return;
        const rows: UpcSalesComp[] =
          answer === "ok" && j.daily?.length > 0 ? combineSalesCompRows(j.daily) : [];
        dispatch(mergeDevSalesCompLY({ rows, codes: missingLy }));
      } catch {
        /* supplementary — the tab is already usable on TY alone */
      } finally {
        dispatch(setDevSalesCompLYLoading(false));
        if (abandoned) retry();
      }
    };

    load();
  }, [ctx.activeTab, missingLyKey, retryTick]);

  const filtered = useMemo(() => {
    return ctx.selectedUpcs.length > 0
      ? ctx.salesComp.filter((s) => ctx.selectedUpcs.includes(s.product_code))
      : ctx.salesComp;
  }, [ctx.salesComp, ctx.selectedUpcs]);

  const filteredLY = useMemo(() => {
    return ctx.selectedUpcs.length > 0
      ? ctx.salesCompLY.filter((s) => ctx.selectedUpcs.includes(s.product_code))
      : ctx.salesCompLY;
  }, [ctx.salesCompLY, ctx.selectedUpcs]);

  const upcCodes = useMemo(() => salesCompCodes(filtered, filteredLY), [filtered, filteredLY]);

  const range = useMemo(
    () => salesCompRange(ctx.startDate, ctx.endDate),
    [ctx.startDate, ctx.endDate],
  );
  const upcStats = useMemo(
    () => computeUpcSalesCompStats(upcCodes, filtered, filteredLY, range),
    [upcCodes, filtered, filteredLY, range],
  );

  // Keep the detail panel on a valid item: the first by default, re-picked if
  // the selection drops out of the filtered set.
  useEffect(() => {
    if (!upcStats.length) {
      setSelectedCode(null);
      return;
    }
    if (!selectedCode || !upcStats.some((s) => s.code === selectedCode)) {
      setSelectedCode(upcStats[0].code);
    }
  }, [upcStats, selectedCode]);

  if (!upcCodes.length) {
    return (
      <div className="flex items-center justify-center h-full text-[11px] text-content/85">
        {ctx.salesCompLoading ? "Loading sales comparison…" : "No sales comparison data"}
      </div>
    );
  }

  const selectedStats =
    upcStats.find((s) => s.code === selectedCode) ?? upcStats[0];

  return (
    <div className="flex-1 overflow-hidden flex min-h-0">
      <SalesCompLeftList
        stats={upcStats}
        selectedCode={selectedCode}
        onSelect={setSelectedCode}
      />
      {selectedStats && <SalesCompDetailPanel stats={selectedStats} />}
    </div>
  );
};

export default SalesCompTab;
