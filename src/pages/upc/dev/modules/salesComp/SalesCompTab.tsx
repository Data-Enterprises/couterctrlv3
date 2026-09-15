import { useEffect, useMemo, useState } from "react";
import { useUpcDevCtx } from "../../hooks/useUpcDevCtx";
import { useAppDispatch } from "../../../../../hooks";
import {
  mergeDevSalesComp,
  mergeDevSalesCompLY,
  setDevSalesCompLoading,
  setDevSalesCompLYLoading,
  setDevUpcItems,
} from "../../../../../features/upcDevSlice";
import { getSalesComp } from "../../../../../api/upc";
import { sameWeekDayLastYear } from "../../../../../utils";
import { upcQueue } from "../../upcQueue";
import { missingFrom } from "../../coverage";
import { combineSalesCompRows, computeUpcSalesCompStats } from "./salesCompStats";
import type { UpcSalesComp } from "../../../../../interfaces";
import SalesCompLeftList from "./SalesCompLeftList";
import SalesCompDetailPanel from "./SalesCompDetailPanel";

/** sameWeekDayLastYear returns ISO (YYYY-MM-DD); the API rejects that with a
 *  400 ("Please use mm/dd/yyyy") — reformat to match ctx.startDate/endDate's
 *  own m/d/yyyy format. Plain string split, not `new Date(iso)` +
 *  getMonth/getDate — that round-trip parses as UTC midnight and can roll back
 *  a day in any negative-UTC-offset timezone (all of the US). */
const isoToMdy = (iso: string) => {
  const [y, m, d] = iso.split("-");
  return `${Number(m)}/${Number(d)}/${y}`;
};

const SalesCompTab = () => {
  const ctx = useUpcDevCtx();
  const dispatch = useAppDispatch();
  const [selectedCode, setSelectedCode] = useState<string | null>(null);

  // Both fetches ask only for the UPCs they're missing. Joined into a string so
  // they can be effect dependencies: the effect then fires exactly when the
  // gap changes — on a first visit, and again when a search adds a UPC — and
  // not on any other render.
  // searchedUpcs, not upcs: `upcs` is the search card's working list and
  // changes live as the user edits chips in the re-search popup, which would
  // start fetching the moment they typed rather than when they clicked Search.
  // `searchedUpcs` only moves when a search is actually committed.
  const missingTy = missingFrom(ctx.searchedUpcs, ctx.salesCompCoverage);
  const missingLy = missingFrom(ctx.searchedUpcs, ctx.salesCompLYCoverage);
  const missingTyKey = missingTy.join(",");
  const missingLyKey = missingLy.join(",");

  // This year. Used to be fetched by the page as part of the search, which made
  // it the one call every search paid for regardless of which module the user
  // opened. It's this tab's own data like anything else now.
  useEffect(() => {
    if (ctx.activeTab !== "salesComp") return;
    if (ctx.salesCompLoading || !ctx.storeids || !missingTyKey) return;

    const load = async () => {
      dispatch(setDevSalesCompLoading(true));
      try {
        const res = await upcQueue.enqueue(`salesComp:ty:${missingTyKey}`, (signal) =>
          getSalesComp(ctx.url, ctx.token, ctx.storeids, ctx.startDate, ctx.endDate, missingTyKey, signal),
        );
        // Superseded by a newer search — that run owns this state now.
        if (!res) return;

        const j = res.data;
        // Combined on the way in, so the table, KPI strip and export all see
        // one row per UPC per week — see combineSalesCompRows.
        const rows: UpcSalesComp[] =
          j.error === 0 && j.daily?.length > 0 ? combineSalesCompRows(j.daily) : [];
        // Merged against the UPCs that were *asked for*, not the ones that
        // answered: a UPC with no sales in the window returns nothing, and it
        // still has to count as covered or it would be re-requested forever.
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
      }
    };

    load();
  }, [ctx.activeTab, missingTyKey]);

  // Last year is a second hit on upload_upcs_daily_sales — the heaviest
  // endpoint the page has — so a user who opens to Trend or Price Opt never
  // pays for it. Deliberately supplementary: a failed or empty response leaves
  // the tab working off TY alone, and `hasLY` in SalesCompKpis leaves the vs-LY
  // figures null rather than reporting a comparison against nothing. Coverage
  // extends either way, so a genuinely empty last year isn't re-requested on
  // every revisit.
  useEffect(() => {
    if (ctx.activeTab !== "salesComp") return;
    if (ctx.salesCompLYLoading || !ctx.storeids || !missingLyKey) return;

    const load = async () => {
      dispatch(setDevSalesCompLYLoading(true));
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
        if (!res) return;

        const j = res.data;
        const rows: UpcSalesComp[] =
          j.error === 0 && j.daily?.length > 0 ? combineSalesCompRows(j.daily) : [];
        dispatch(mergeDevSalesCompLY({ rows, codes: missingLy }));
      } catch {
        /* supplementary — the tab is already usable on TY alone */
      } finally {
        dispatch(setDevSalesCompLYLoading(false));
      }
    };

    load();
  }, [ctx.activeTab, missingLyKey]);

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

  const upcCodes = useMemo(
    () => [...new Set(filtered.map((r) => r.product_code))],
    [filtered],
  );

  const upcStats = useMemo(
    () => computeUpcSalesCompStats(upcCodes, filtered, filteredLY, ctx.endDate),
    [upcCodes, filtered, filteredLY, ctx.endDate],
  );

  // Keep the detail panel pointed at a valid item — default to the first
  // one on load, and re-pick whenever the current selection drops out of
  // the filtered set (e.g. a re-search or UPC deselect).
  useEffect(() => {
    if (!upcStats.length) {
      setSelectedCode(null);
      return;
    }
    if (!selectedCode || !upcStats.some((s) => s.code === selectedCode)) {
      setSelectedCode(upcStats[0].code);
    }
  }, [upcStats, selectedCode]);

  if (!filtered.length) {
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
