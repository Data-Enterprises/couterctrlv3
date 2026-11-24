// Hooks
import { useEffect } from "react";
import { useAppDispatch } from "../../../../hooks";
import { useToast } from "../../../../components/toasts/hooks/useToast";
import { useReceivingWalk, type ItemReportCtx } from ".";

// Redux
import {
  setItemReportLoading,
  startItemReportSearch,
  setItemReportResults,
  setItemReportSearchOpen,
  clearItemReportHandoff,
  setItemReportSource,
  type ItemReportHandoff,
} from "../../../../features/dev/devItemReportSlice";

// Utils
import { collectCriticalItems } from "../../../../utils/itemGrading";
import { scopeToStoreNumber } from "../../../../utils/storeIdentity";
import { normalizeProductCode } from "../../../../utils/productCode";
import {
  fetchAllItemRows,
  fetchItemRowsForCodes,
  fetchItemRowsWithPricePoints,
  lwWindow,
  lyWindow,
  weekEnding,
  SUBS_PRICE_POINTS,
} from "../utils";

// Interfaces
import type { ReportScope } from "../interfaces";
import type { SubDeptMargin, SubsPricePoint } from "../../../../interfaces";

/**
 * The search: reads three weeks of sales (or takes a handed-over week), grades
 * a handed-over threshold, stores the results and starts the receiving walk
 * behind them. A handoff in the slice runs itself once on arrival.
 */
export const useItemReportRun = (
  state: ItemReportCtx,
  resetActual: () => void,
) => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const { url, token } = state;
  const { startWalk, cancelWalk } = useReceivingWalk();

  const run = async (
    upcs: string[],
    uploadDepartments: string[],
    /** Where the list came from. Absent for an upload, which is the point —
     *  every run sets it, so a manual search can't inherit the provenance of a
     *  handoff that ran before it. */
    source?: { sourceLabel: string; basisLabel: string },
    /** A handed-over week and its rows. When present the department fan-out is
     *  skipped entirely — the caller already made those calls to grade the
     *  items it is passing over. */
    preloaded?: {
      window: { start: string; end: string };
      rows?: { ty: SubDeptMargin[]; lw: SubDeptMargin[]; ly: SubDeptMargin[] };
      /** Grading the caller deferred — resolved here, after the fetch. */
      grade?: ItemReportHandoff["grade"];
    },
  ) => {
    if (!state.storeId) {
      toast.warn("Please select a store");
      return;
    }
    if (upcs.length === 0 && !preloaded?.grade) {
      toast.warn("Add or upload at least one UPC");
      return;
    }
    // One date in, a fixed seven-day week out — the same contract the graded
    // pages work to, and what keeps the three periods comparable. A handoff
    // brings its own window, because its rows were fetched against that one and
    // the picker may have moved since.
    const week = preloaded?.window ?? weekEnding(state.singleDate);
    const next: ReportScope = {
      url,
      token,
      storeid: state.storeId,
      start: week.start,
      end: week.end,
    };
    dispatch(setItemReportSearchOpen(false));
    dispatch(setItemReportLoading({ loading: true }));
    dispatch(startItemReportSearch());
    dispatch(
      setItemReportSource(source ?? { sourceLabel: "", basisLabel: "" }),
    );
    resetActual();
    cancelWalk();

    try {
      // Rows in hand: nothing to fetch, so the report is on screen immediately
      // and only the invoice walk is left running behind it.
      if (preloaded?.rows) {
        dispatch(
          setItemReportResults({
            scope: { storeid: next.storeid, start: next.start, end: next.end },
            upcs,
            uploadDepartments,
            tyRows: preloaded.rows.ty,
            lwRows: preloaded.rows.lw,
            lyRows: preloaded.rows.ly,
          }),
        );
        // The handed-over list, and only that — same rule as the fetched path.
        const retained = new Set(upcs);
        void startWalk(next, [...retained]);
        return;
      }

      dispatch(
        setItemReportLoading({ loading: true, message: "Reading sales…" }),
      );

      /**
       * One read per window.
       *
       * `subs/subs` answers for every department at once, so nothing has to
       * discover which departments exist first — which is what the two
       * ninety-day `sub_sales` calls were for, and why they reached back a
       * quarter to answer a question about one week.
       *
       * This week and last week used to share one fourteen-day range that was
       * split by date afterwards. They are separate reads now because the
       * price points ride on this call: a span request returns the prices of
       * BOTH weeks with no way to tell them apart — a point's `units` covers
       * the whole range — so last week's prices appeared in a panel headed by
       * this week's dates, and `highestPrice` spanned fourteen days while
       * every figure it is quoted against spanned seven.
       *
       * Only this week asks for points. Last week and last year carry none,
       * so the split costs no extra aggregate — and each response is smaller
       * than the span's was.
       */
      /**
       * Ask for the uploaded items, or for the whole store.
       *
       * `buildReport` keeps only the uploaded list — `for (const code of
       * wanted)` — so on the upload path every other item in the store was
       * fetched, paged, transferred and discarded. `subs/item_actions` pushes
       * the codes into the query instead: 100 rows in 109ms against 11,799 in
       * 781ms, and the narrowed answer fits in one page, so the count and the
       * concurrent page burst stop happening rather than getting cheaper.
       *
       * The grade path cannot use it. Arriving with a threshold instead of a
       * list, the page has no codes yet — `collectCriticalItems` derives them
       * FROM the store's rows below — so it still reads the whole store.
       */
      const narrowed = !preloaded?.grade && upcs.length > 0;

      const [tyResult, lw, ly] = await Promise.all([
        narrowed
          ? fetchItemRowsForCodes(
              next,
              { start: next.start, end: next.end },
              upcs,
            )
          : SUBS_PRICE_POINTS
            ? fetchItemRowsWithPricePoints(next, {
                start: next.start,
                end: next.end,
              })
            : fetchAllItemRows(next, { start: next.start, end: next.end }).then(
                (rows) => ({ rows, pricePoints: [] as SubsPricePoint[] }),
              ),
        narrowed
          ? fetchItemRowsForCodes(next, lwWindow(next), upcs).then(
              (r) => r.rows,
            )
          : fetchAllItemRows(next, lwWindow(next)),
        narrowed
          ? fetchItemRowsForCodes(next, lyWindow(next), upcs).then(
              (r) => r.rows,
            )
          : fetchAllItemRows(next, lyWindow(next)),
      ]);

      const ty = tyResult.rows;

      if (ty.length === 0 && lw.length === 0 && ly.length === 0) {
        toast.warn("No sales came back for that store and week");
        return;
      }

      /**
       * Deferred grading, resolved now that the rows are here.
       *
       * The rule is still the caller's — this page invents no severity of its
       * own. All that moved is *when* it gets applied, so the wait happens on
       * this page's loading screen rather than on the one the user just left.
       */
      let tyRows = ty;
      let lwRows = lw;
      let lyRows = ly;
      let listUpcs = upcs;
      let listDepts = uploadDepartments;

      if (preloaded?.grade) {
        const num = preloaded.grade.storeNumber;
        tyRows = scopeToStoreNumber(ty, num);
        lwRows = scopeToStoreNumber(lw, num);
        lyRows = scopeToStoreNumber(ly, num);

        const graded = collectCriticalItems(
          tyRows,
          lwRows,
          lyRows,
          preloaded.grade.threshold,
          preloaded.grade.metric,
        );
        if (graded.length === 0) {
          toast.info("No critical items in that store for that week");
          return;
        }
        listUpcs = [
          ...new Set(graded.map((g) => normalizeProductCode(g.productCode))),
        ];
        listDepts = [
          ...new Set(graded.map((g) => g.dept).filter((d) => d.length > 0)),
        ];
      }

      dispatch(
        setItemReportResults({
          scope: { storeid: next.storeid, start: next.start, end: next.end },
          upcs: listUpcs,
          uploadDepartments: listDepts,
          tyRows,
          lwRows,
          lyRows,
          pricePoints: tyResult.pricePoints,
        }),
      );

      // The uploaded list, and only that. It used to be widened with every
      // product that sold in any of the three windows, so the sheet could
      // discover items the file never named — but those codes travel to
      // `receivers/item_search` as the request body, and on a full store that
      // was 10,831 of them against a 2,000 ceiling. The report answers for the
      // list it was given.
      const retain = new Set(listUpcs);

      // Deliberately not awaited — the sheet is readable before the walk lands,
      // and receipts fill in behind it.
      void startWalk(next, [...retain]);
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Could not build the action list",
      );
    } finally {
      dispatch(setItemReportLoading({ loading: false }));
    }
  };

  /**
   * A list handed over from Sub Dept Margins or Vendors.
   *
   * The handoff is cleared *before* the run starts, not after: `run` dispatches
   * on the way through, and a re-render that still saw the handoff would fire a
   * second identical fan-out on top of the first.
   */
  const handoff = state.handoff;
  useEffect(() => {
    if (!handoff) return;
    dispatch(clearItemReportHandoff());
    void run(
      handoff.upcs,
      handoff.departments,
      { sourceLabel: handoff.sourceLabel, basisLabel: handoff.basisLabel },
      { window: handoff.window, rows: handoff.rows, grade: handoff.grade },
    );
    // Keyed on the handoff object alone: `run` is redefined every render, and
    // depending on it would re-fire the fan-out on each one.
  }, [handoff]);

  return run;
};
